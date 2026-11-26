-- 0005_manual_checkin_and_zones.sql
-- VAGASPOT Phase 5: COMSATS campus zones seed, Asia/Karachi expiry calculation,
-- and separate secure manual check-in RPCs.
-- Enforces owner-approved rules:
--   - Availability & zone/note share one expiry: min(now + 2h, 18:00 Asia/Karachi); closed 18:00..23:59 PKT, reopens 00:00 PKT
--   - Campus freshness: 8-hour window from verified check-in (does not expire at 18:00 PKT)
--   - Off Campus automatically clears availability, zone, and note
--   - Utility/restricted rooms seeded with is_active = false

begin;

-- 1. Seed COMSATS Islamabad campus config (boundary_geojson stays NULL until Release 2 georeferencing)
insert into public.campus_config (id, display_name, timezone, boundary_geojson, boundary_version, geofence_config, is_active)
values ('comsats-islamabad', 'COMSATS University Islamabad', 'Asia/Karachi', null, null, null, true)
on conflict (id) do update set
  display_name = excluded.display_name,
  timezone = excluded.timezone,
  is_active = excluded.is_active;

-- 2. Seed the 34 COMSATS campus zones from data/comsats-campus-zones.csv
insert into public.campus_zones (id, name, category, display_order, is_active, show_in_quick_list)
values
  ('gate-1', 'Gate 1', 'entry', 1, true, true),
  ('gate-2', 'Gate 2', 'entry', 2, true, true),
  ('parking', 'Parking', 'transport', 3, true, true),
  ('mosque', 'Mosque', 'social', 4, true, true),
  ('sitting-place', 'Sitting Place', 'social', 5, true, true),
  ('academic-block-i', 'Academic Block I', 'academic', 6, true, true),
  ('physics-block', 'Physics Block', 'academic', 7, true, true),
  ('staff-canteen', 'Staff Canteen', 'food', 8, true, false),
  ('academic-block-ii', 'Academic Block II', 'academic', 9, true, true),
  ('faculty-block-i', 'Faculty Block I', 'academic', 10, true, false),
  ('faculty-block-ii', 'Faculty Block II', 'academic', 11, true, false),
  ('library', 'Library', 'learning', 12, true, true),
  ('n-block', 'N-Block', 'academic', 13, true, true),
  ('sitting-space', 'Sitting Space', 'social', 14, true, true),
  ('student-services-centre', 'Student Services Centre', 'services', 15, true, true),
  ('store', 'Store', 'services', 16, false, false),
  ('academic-block-iii', 'Academic Block III', 'academic', 17, true, true),
  ('ssbc', 'SSBC', 'academic', 18, true, true),
  ('r-and-d-lab', 'R & D Lab', 'lab', 19, true, false),
  ('tennis-court', 'Tennis Court', 'sports', 20, true, true),
  ('badminton-court', 'Badminton Court', 'sports', 21, true, true),
  ('basketball-court', 'Basketball Court', 'sports', 22, true, true),
  ('cricket-ground', 'Cricket Ground', 'sports', 23, true, true),
  ('bus-parking', 'Bus Parking', 'transport', 24, true, true),
  ('gate-3', 'Gate 3', 'entry', 25, true, true),
  ('generator-room', 'Generator Room', 'services', 26, false, false),
  ('glass-room', 'Glass Room', 'services', 27, true, false),
  ('clean-room', 'Clean Room', 'lab', 28, false, false),
  ('dispensary', 'Dispensary', 'health', 29, true, true),
  ('office', 'Office', 'services', 30, true, false),
  ('dental-care-unit', 'Dental Care Unit', 'health', 31, true, true),
  ('meteorological-office', 'Meteorological Office', 'services', 32, false, false),
  ('ht-panel-room', 'HT Panel Room', 'services', 33, false, false),
  ('parking-shed', 'Parking Shed', 'transport', 34, true, true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  show_in_quick_list = excluded.show_in_quick_list;

-- 3. Deterministic Asia/Karachi window expiry helper:
--    Reopens 00:00 PKT; returns min(p_now + 2h, 18:00 PKT), or NULL if p_now >= 18:00 PKT.
create or replace function public.compute_pkt_window_expiry(p_now timestamptz default now())
returns timestamptz
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_local timestamp;
  v_cutoff timestamptz;
begin
  v_local := p_now at time zone 'Asia/Karachi';
  v_cutoff := (date_trunc('day', v_local) + interval '18 hours') at time zone 'Asia/Karachi';

  if p_now >= v_cutoff then
    return null;
  end if;

  return least(p_now + interval '2 hours', v_cutoff);
end;
$$;

revoke all on function public.compute_pkt_window_expiry(timestamptz) from public, anon, authenticated;
grant execute on function public.compute_pkt_window_expiry(timestamptz) to authenticated;

-- 4. set_my_campus_state(p_squad_id, p_state)
--    Server sets campus_source='manual', 8-hour freshness window, 2h manual override.
--    Setting 'off_campus' automatically clears availability, zone, and note.
--    Setting 'on_campus' or 'unknown' preserves active availability/zone.
create or replace function public.set_my_campus_state(p_squad_id uuid, p_state text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_ghost boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_member(p_squad_id) then
    raise exception 'Not a member of this squad' using errcode = '42501';
  end if;

  if p_state is null or p_state not in ('on_campus', 'off_campus', 'unknown') then
    raise exception 'Invalid campus state' using errcode = '22023';
  end if;

  select pr.ghost_mode
    into v_ghost
  from public.presence pr
  where pr.squad_id = p_squad_id
    and pr.user_id = v_uid
  for update;

  if coalesce(v_ghost, false) then
    raise exception 'Turn off Ghost Mode before updating your check-in' using errcode = 'P0001';
  end if;

  insert into public.presence (squad_id, user_id, campus_state, ghost_mode)
  values (p_squad_id, v_uid, 'unknown', false)
  on conflict (squad_id, user_id) do nothing;

  if p_state = 'off_campus' then
    update public.presence
    set campus_state = 'off_campus',
        campus_source = 'manual',
        campus_observed_at = v_now,
        campus_fresh_until = v_now + interval '8 hours',
        manual_override_until = v_now + interval '2 hours',
        availability = null,
        availability_source = null,
        availability_updated_at = null,
        availability_expires_at = null,
        zone_id = null,
        zone_source = null,
        zone_updated_at = null,
        zone_expires_at = null,
        note = null
    where squad_id = p_squad_id
      and user_id = v_uid;
  elsif p_state = 'unknown' then
    update public.presence
    set campus_state = 'unknown',
        campus_source = null,
        campus_observed_at = null,
        campus_fresh_until = null,
        manual_override_until = null
    where squad_id = p_squad_id
      and user_id = v_uid;
  else
    update public.presence
    set campus_state = 'on_campus',
        campus_source = 'manual',
        campus_observed_at = v_now,
        campus_fresh_until = v_now + interval '8 hours',
        manual_override_until = v_now + interval '2 hours'
    where squad_id = p_squad_id
      and user_id = v_uid;
  end if;

  perform public.touch_squad_feed_signal(p_squad_id);
end;
$$;

revoke all on function public.set_my_campus_state(uuid, text) from public, anon, authenticated;
grant execute on function public.set_my_campus_state(uuid, text) to authenticated;

-- 5. set_my_availability(p_squad_id, p_availability)
--    Validates enum, computes min(+2h, 18:00 PKT), rejects active writes 18:00..23:59 PKT.
--    Syncs shared expiry with active zone if present.
create or replace function public.set_my_availability(p_squad_id uuid, p_availability text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_expires timestamptz;
  v_ghost boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_member(p_squad_id) then
    raise exception 'Not a member of this squad' using errcode = '42501';
  end if;

  select pr.ghost_mode
    into v_ghost
  from public.presence pr
  where pr.squad_id = p_squad_id
    and pr.user_id = v_uid
  for update;

  if coalesce(v_ghost, false) then
    raise exception 'Turn off Ghost Mode before updating availability' using errcode = 'P0001';
  end if;

  insert into public.presence (squad_id, user_id, campus_state, ghost_mode)
  values (p_squad_id, v_uid, 'unknown', false)
  on conflict (squad_id, user_id) do nothing;

  if p_availability is null then
    update public.presence
    set availability = null,
        availability_source = null,
        availability_updated_at = null,
        availability_expires_at = null
    where squad_id = p_squad_id
      and user_id = v_uid;

    perform public.touch_squad_feed_signal(p_squad_id);
    return null;
  end if;

  if p_availability not in ('free', 'in_class', 'busy', 'looking_for_friends') then
    raise exception 'Invalid availability value' using errcode = '22023';
  end if;

  v_expires := public.compute_pkt_window_expiry(v_now);
  if v_expires is null then
    raise exception 'Availability check-ins close at 6:00 PM PKT and reopen at midnight' using errcode = 'P0001';
  end if;

  update public.presence
  set availability = p_availability,
      availability_source = 'manual',
      availability_updated_at = v_now,
      availability_expires_at = v_expires,
      zone_id = case when zone_expires_at is not null and zone_expires_at > v_now then zone_id else null end,
      zone_source = case when zone_expires_at is not null and zone_expires_at > v_now then zone_source else null end,
      zone_updated_at = case when zone_expires_at is not null and zone_expires_at > v_now then zone_updated_at else null end,
      zone_expires_at = case when zone_expires_at is not null and zone_expires_at > v_now then v_expires else null end,
      note = case when zone_expires_at is not null and zone_expires_at > v_now then note else null end
  where squad_id = p_squad_id
    and user_id = v_uid;

  perform public.touch_squad_feed_signal(p_squad_id);
  return v_expires;
end;
$$;

revoke all on function public.set_my_availability(uuid, text) from public, anon, authenticated;
grant execute on function public.set_my_availability(uuid, text) to authenticated;

-- 6. set_my_zone(p_squad_id, p_zone_id, p_note)
--    Validates active campus_zones row & note <= 60 chars, computes min(+2h, 18:00 PKT).
create or replace function public.set_my_zone(
  p_squad_id uuid,
  p_zone_id text,
  p_note text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_note text;
  v_expires timestamptz;
  v_ghost boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_member(p_squad_id) then
    raise exception 'Not a member of this squad' using errcode = '42501';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 60 then
    raise exception 'Note must be 60 characters or fewer' using errcode = '22023';
  end if;

  select pr.ghost_mode
    into v_ghost
  from public.presence pr
  where pr.squad_id = p_squad_id
    and pr.user_id = v_uid
  for update;

  if coalesce(v_ghost, false) then
    raise exception 'Turn off Ghost Mode before updating your spot' using errcode = 'P0001';
  end if;

  insert into public.presence (squad_id, user_id, campus_state, ghost_mode)
  values (p_squad_id, v_uid, 'unknown', false)
  on conflict (squad_id, user_id) do nothing;

  if p_zone_id is null and v_note is null then
    update public.presence
    set zone_id = null,
        zone_source = null,
        zone_updated_at = null,
        zone_expires_at = null,
        note = null
    where squad_id = p_squad_id
      and user_id = v_uid;

    perform public.touch_squad_feed_signal(p_squad_id);
    return null;
  end if;

  if p_zone_id is not null then
    if not exists (
      select 1
      from public.campus_zones cz
      where cz.id = p_zone_id
        and cz.is_active = true
    ) then
      raise exception 'Selected campus zone is not active or does not exist' using errcode = '22023';
    end if;
  end if;

  v_expires := public.compute_pkt_window_expiry(v_now);
  if v_expires is null then
    raise exception 'Campus spot check-ins close at 6:00 PM PKT and reopen at midnight' using errcode = 'P0001';
  end if;

  update public.presence
  set zone_id = p_zone_id,
      zone_source = case when p_zone_id is not null then 'manual' else null end,
      zone_updated_at = case when p_zone_id is not null then v_now else null end,
      zone_expires_at = case when p_zone_id is not null then v_expires else null end,
      note = v_note,
      availability = case when availability_expires_at is not null and availability_expires_at > v_now then availability else null end,
      availability_source = case when availability_expires_at is not null and availability_expires_at > v_now then availability_source else null end,
      availability_updated_at = case when availability_expires_at is not null and availability_expires_at > v_now then availability_updated_at else null end,
      availability_expires_at = case when availability_expires_at is not null and availability_expires_at > v_now then v_expires else null end
  where squad_id = p_squad_id
    and user_id = v_uid;

  perform public.touch_squad_feed_signal(p_squad_id);
  return v_expires;
end;
$$;

revoke all on function public.set_my_zone(uuid, text, text) from public, anon, authenticated;
grant execute on function public.set_my_zone(uuid, text, text) to authenticated;

commit;
