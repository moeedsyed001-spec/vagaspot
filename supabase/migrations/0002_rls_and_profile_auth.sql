-- 0002_rls_and_profile_auth.sql
-- VAGASPOT Phase 2: Membership helpers, strict RLS policies, and profile bootstrap/update.
-- Zero permissive USING (true) policies. Zero anon table/RPC access.

begin;

-- 1. Non-recursive SECURITY DEFINER membership helpers
create or replace function public.is_active_squad_member(p_squad_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.squad_members sm
      where sm.squad_id = p_squad_id
        and sm.user_id = auth.uid()
        and sm.is_active = true
    );
$$;

create or replace function public.shares_active_squad_with(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and p_other_user_id is not null
    and exists (
      select 1
      from public.squad_members mine
      join public.squad_members theirs
        on theirs.squad_id = mine.squad_id
      where mine.user_id = auth.uid()
        and mine.is_active = true
        and theirs.user_id = p_other_user_id
        and theirs.is_active = true
    );
$$;

revoke all on function public.is_active_squad_member(uuid) from public, anon, authenticated;
grant execute on function public.is_active_squad_member(uuid) to authenticated;

revoke all on function public.shares_active_squad_with(uuid) from public, anon, authenticated;
grant execute on function public.shares_active_squad_with(uuid) to authenticated;

-- 2. Profile bootstrap trigger on auth.users + safe idempotent RPC fallback
create or replace function public.derive_profile_display_name(p_meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(
      left(
        btrim(
          coalesce(
            p_meta ->> 'full_name',
            p_meta ->> 'name',
            ''
          )
        ),
        50
      ),
      ''
    ),
    'Friend'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_avatar_url text;
begin
  v_display_name := public.derive_profile_display_name(new.raw_user_meta_data);
  v_avatar_url := nullif(
    btrim(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')),
    ''
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, v_display_name, v_avatar_url)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.derive_profile_display_name(jsonb) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.ensure_my_profile()
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_meta jsonb;
  v_display_name text;
  v_avatar_url text;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    select u.raw_user_meta_data
      into v_meta
    from auth.users u
    where u.id = v_uid;

    v_display_name := public.derive_profile_display_name(coalesce(v_meta, '{}'::jsonb));
    v_avatar_url := nullif(
      btrim(coalesce(v_meta ->> 'avatar_url', v_meta ->> 'picture', '')),
      ''
    );

    insert into public.profiles (id, display_name, avatar_url)
    values (v_uid, v_display_name, v_avatar_url)
    on conflict (id) do nothing;
  end if;

  return query
  select p.id, p.display_name, p.avatar_url, p.created_at, p.updated_at
  from public.profiles p
  where p.id = v_uid;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon, authenticated;
grant execute on function public.ensure_my_profile() to authenticated;

create or replace function public.update_my_profile(p_display_name text)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_trimmed text;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  v_trimmed := btrim(coalesce(p_display_name, ''));
  if char_length(v_trimmed) < 1 or char_length(v_trimmed) > 50 then
    raise exception 'Display name must be between 1 and 50 characters' using errcode = '22023';
  end if;

  update public.profiles p
  set display_name = v_trimmed
  where p.id = v_uid;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  return query
  select p.id, p.display_name, p.avatar_url, p.created_at, p.updated_at
  from public.profiles p
  where p.id = v_uid;
end;
$$;

revoke all on function public.update_my_profile(text) from public, anon, authenticated;
grant execute on function public.update_my_profile(text) to authenticated;

-- 3. Narrow table grants for authenticated users (zero grants to anon)
grant select (id, display_name, avatar_url, created_at, updated_at)
  on public.profiles to authenticated;
grant update (display_name)
  on public.profiles to authenticated;

grant select (id, name, created_by, is_archived, created_at)
  on public.squads to authenticated;

grant select (id, squad_id, user_id, role, is_active, joined_at)
  on public.squad_members to authenticated;

grant select (squad_id, last_changed_at)
  on public.squad_feed_signals to authenticated;

grant select (id, name, category, display_order, is_active, show_in_quick_list)
  on public.campus_zones to authenticated;

grant select (id, display_name, timezone, boundary_geojson, boundary_version, geofence_config, is_active, updated_at)
  on public.campus_config to authenticated;

grant select, insert, update, delete
  on public.notification_preferences to authenticated;

grant select, insert, update, delete
  on public.push_devices to authenticated;

-- Explicitly NO direct SELECT/INSERT/UPDATE/DELETE grants on:
--   public.presence
--   public.squad_invites
--   public.invite_redeem_attempts
--   public.push_delivery_dedupe

-- 4. RLS Policies (default deny; authenticated only)

-- profiles
drop policy if exists profiles_select_self_or_peer on public.profiles;
create policy profiles_select_self_or_peer
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.shares_active_squad_with(id)
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- squads
drop policy if exists squads_select_member on public.squads;
create policy squads_select_member
  on public.squads
  for select
  to authenticated
  using (public.is_active_squad_member(id));

-- squad_members
drop policy if exists squad_members_select_member on public.squad_members;
create policy squad_members_select_member
  on public.squad_members
  for select
  to authenticated
  using (public.is_active_squad_member(squad_id));

-- squad_feed_signals
drop policy if exists squad_feed_signals_select_member on public.squad_feed_signals;
create policy squad_feed_signals_select_member
  on public.squad_feed_signals
  for select
  to authenticated
  using (public.is_active_squad_member(squad_id));

-- campus_zones
drop policy if exists campus_zones_select_authenticated on public.campus_zones;
create policy campus_zones_select_authenticated
  on public.campus_zones
  for select
  to authenticated
  using (auth.uid() is not null and is_active = true);

-- campus_config
drop policy if exists campus_config_select_authenticated on public.campus_config;
create policy campus_config_select_authenticated
  on public.campus_config
  for select
  to authenticated
  using (auth.uid() is not null and is_active = true);

-- notification_preferences (own rows only, and only while active member)
drop policy if exists notification_prefs_select_own on public.notification_preferences;
create policy notification_prefs_select_own
  on public.notification_preferences
  for select
  to authenticated
  using (user_id = auth.uid() and public.is_active_squad_member(squad_id));

drop policy if exists notification_prefs_insert_own on public.notification_preferences;
create policy notification_prefs_insert_own
  on public.notification_preferences
  for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_active_squad_member(squad_id));

drop policy if exists notification_prefs_update_own on public.notification_preferences;
create policy notification_prefs_update_own
  on public.notification_preferences
  for update
  to authenticated
  using (user_id = auth.uid() and public.is_active_squad_member(squad_id))
  with check (user_id = auth.uid() and public.is_active_squad_member(squad_id));

drop policy if exists notification_prefs_delete_own on public.notification_preferences;
create policy notification_prefs_delete_own
  on public.notification_preferences
  for delete
  to authenticated
  using (user_id = auth.uid());

-- push_devices (own rows only)
drop policy if exists push_devices_select_own on public.push_devices;
create policy push_devices_select_own
  on public.push_devices
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists push_devices_insert_own on public.push_devices;
create policy push_devices_insert_own
  on public.push_devices
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists push_devices_update_own on public.push_devices;
create policy push_devices_update_own
  on public.push_devices
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists push_devices_delete_own on public.push_devices;
create policy push_devices_delete_own
  on public.push_devices
  for delete
  to authenticated
  using (user_id = auth.uid());

commit;
