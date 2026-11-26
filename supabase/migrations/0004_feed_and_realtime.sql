-- 0004_feed_and_realtime.sql
-- VAGASPOT Phase 4: Secure squad feed RPC + minimal Realtime invalidation signal.
-- Enforces:
--   - Active squad membership check
--   - Ghost Mode server-side redaction (all presence/timestamp fields NULL)
--   - 8-hour campus freshness cutoff (stale becomes 'unknown', never 'off_campus')
--   - Shared availability/zone/note expiry evaluation
--   - Realtime published ONLY on public.squad_feed_signals (NOT raw public.presence)

begin;

create or replace function public.get_squad_feed(p_squad_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  role text,
  is_ghost boolean,
  campus_state text,
  campus_source text,
  campus_observed_at timestamptz,
  availability text,
  availability_expires_at timestamptz,
  zone_id text,
  zone_name text,
  note text,
  last_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_member(p_squad_id) then
    raise exception 'Not a member of this squad' using errcode = '42501';
  end if;

  return query
  select
    sm.user_id,
    p.display_name,
    p.avatar_url,
    sm.role,
    coalesce(pr.ghost_mode, false) as is_ghost,
    case
      when coalesce(pr.ghost_mode, false) then null
      when pr.campus_state is null then 'unknown'
      when pr.campus_fresh_until is not null and pr.campus_fresh_until <= v_now then 'unknown'
      when pr.campus_observed_at is not null and pr.campus_observed_at + interval '8 hours' <= v_now then 'unknown'
      else pr.campus_state
    end as campus_state,
    case
      when coalesce(pr.ghost_mode, false) then null
      when pr.campus_state is null then null
      when pr.campus_fresh_until is not null and pr.campus_fresh_until <= v_now then null
      when pr.campus_observed_at is not null and pr.campus_observed_at + interval '8 hours' <= v_now then null
      else pr.campus_source
    end as campus_source,
    case
      when coalesce(pr.ghost_mode, false) then null
      when pr.campus_state is null then null
      when pr.campus_fresh_until is not null and pr.campus_fresh_until <= v_now then null
      when pr.campus_observed_at is not null and pr.campus_observed_at + interval '8 hours' <= v_now then null
      else pr.campus_observed_at
    end as campus_observed_at,
    case
      when coalesce(pr.ghost_mode, false) then null
      when pr.availability is not null
        and pr.availability_expires_at is not null
        and pr.availability_expires_at > v_now
      then pr.availability
      else null
    end as availability,
    case
      when coalesce(pr.ghost_mode, false) then null
      when pr.availability is not null
        and pr.availability_expires_at is not null
        and pr.availability_expires_at > v_now
      then pr.availability_expires_at
      else null
    end as availability_expires_at,
    case
      when coalesce(pr.ghost_mode, false) then null
      when pr.zone_id is not null
        and pr.zone_expires_at is not null
        and pr.zone_expires_at > v_now
      then pr.zone_id
      else null
    end as zone_id,
    case
      when coalesce(pr.ghost_mode, false) then null
      when pr.zone_id is not null
        and pr.zone_expires_at is not null
        and pr.zone_expires_at > v_now
      then cz.name
      else null
    end as zone_name,
    case
      when coalesce(pr.ghost_mode, false) then null
      when pr.note is not null
        and coalesce(pr.zone_expires_at, pr.availability_expires_at) is not null
        and coalesce(pr.zone_expires_at, pr.availability_expires_at) > v_now
      then pr.note
      else null
    end as note,
    case
      when coalesce(pr.ghost_mode, false) then null
      else pr.updated_at
    end as last_updated_at
  from public.squad_members sm
  join public.profiles p on p.id = sm.user_id
  left join public.presence pr
    on pr.squad_id = sm.squad_id
   and pr.user_id = sm.user_id
  left join public.campus_zones cz
    on cz.id = pr.zone_id
   and cz.is_active = true
  where sm.squad_id = p_squad_id
    and sm.is_active = true
  order by
    case when sm.user_id = v_uid then 0 else 1 end,
    lower(p.display_name) asc,
    sm.joined_at asc;
end;
$$;

revoke all on function public.get_squad_feed(uuid) from public, anon, authenticated;
grant execute on function public.get_squad_feed(uuid) to authenticated;

-- Trigger: propagate display_name edits to squad_feed_signals so peers refresh live
create or replace function public.notify_squads_on_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_squad_id uuid;
begin
  if new.display_name is distinct from old.display_name then
    for v_squad_id in
      select sm.squad_id
      from public.squad_members sm
      where sm.user_id = new.id
        and sm.is_active = true
    loop
      perform public.touch_squad_feed_signal(v_squad_id);
    end loop;
  end if;
  return new;
end;
$$;

revoke all on function public.notify_squads_on_profile_update() from public, anon, authenticated;

drop trigger if exists trg_profiles_notify_squads on public.profiles;
create trigger trg_profiles_notify_squads
  after update of display_name on public.profiles
  for each row execute function public.notify_squads_on_profile_update();

-- Publish ONLY minimal squad_feed_signals to Supabase Realtime (never raw presence)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'squad_feed_signals'
  ) then
    alter publication supabase_realtime add table public.squad_feed_signals;
  end if;
end;
$$;

commit;
