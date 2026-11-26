-- 0003_squads_and_invites.sql
-- VAGASPOT Phase 3: Private squads, high-entropy single-use hashed invites, and membership RPCs.
-- All mutations validate auth.uid(), membership/role, and run as SECURITY DEFINER with fixed search_path.

begin;

-- Helper: verify caller is an active owner of a non-archived squad
create or replace function public.is_active_squad_owner(p_squad_id uuid)
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
      join public.squads s on s.id = sm.squad_id
      where sm.squad_id = p_squad_id
        and sm.user_id = auth.uid()
        and sm.is_active = true
        and sm.role = 'owner'
        and s.is_archived = false
    );
$$;

revoke all on function public.is_active_squad_owner(uuid) from public, anon, authenticated;
grant execute on function public.is_active_squad_owner(uuid) to authenticated;

-- Helper: touch feed signal without exposing raw presence rows
create or replace function public.touch_squad_feed_signal(p_squad_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.squad_feed_signals (squad_id, last_changed_at)
  values (p_squad_id, now())
  on conflict (squad_id)
  do update set last_changed_at = excluded.last_changed_at;
end;
$$;

revoke all on function public.touch_squad_feed_signal(uuid) from public, anon, authenticated;

-- 1. create_squad(p_name) -> uuid
create or replace function public.create_squad(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_owned_count int;
  v_squad_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  v_name := btrim(coalesce(p_name, ''));
  if char_length(v_name) < 2 or char_length(v_name) > 40 then
    raise exception 'Squad name must be between 2 and 40 characters' using errcode = '22023';
  end if;

  select count(*)
    into v_owned_count
  from public.squad_members sm
  join public.squads s on s.id = sm.squad_id
  where sm.user_id = v_uid
    and sm.is_active = true
    and sm.role = 'owner'
    and s.is_archived = false;

  if v_owned_count >= 10 then
    raise exception 'Maximum owned squad limit reached' using errcode = 'P0001';
  end if;

  perform public.ensure_my_profile();

  insert into public.squads (name, created_by)
  values (v_name, v_uid)
  returning id into v_squad_id;

  insert into public.squad_members (squad_id, user_id, role, is_active)
  values (v_squad_id, v_uid, 'owner', true);

  insert into public.presence (squad_id, user_id, campus_state, ghost_mode)
  values (v_squad_id, v_uid, 'unknown', false);

  perform public.touch_squad_feed_signal(v_squad_id);

  return v_squad_id;
end;
$$;

revoke all on function public.create_squad(text) from public, anon, authenticated;
grant execute on function public.create_squad(text) to authenticated;

-- 2. create_invite(p_squad_id, p_ttl_hours) -> raw token (returned once, stored only as SHA-256 hash)
create or replace function public.create_invite(p_squad_id uuid, p_ttl_hours int default 72)
returns text
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_raw_bytes bytea;
  v_raw_token text;
  v_token_hash bytea;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_owner(p_squad_id) then
    raise exception 'Only the squad owner can create invitations' using errcode = '42501';
  end if;

  if p_ttl_hours is null or p_ttl_hours < 1 or p_ttl_hours > 168 then
    raise exception 'Invite expiration must be between 1 and 168 hours' using errcode = '22023';
  end if;

  -- 128 bits of CSPRNG randomness encoded as URL-safe base64
  v_raw_bytes := extensions.gen_random_bytes(16);
  v_raw_token := translate(replace(encode(v_raw_bytes, 'base64'), '=', ''), '+/', '-_');
  v_token_hash := extensions.digest(convert_to(v_raw_token, 'utf8'), 'sha256');

  insert into public.squad_invites (squad_id, token_hash, created_by, expires_at)
  values (p_squad_id, v_token_hash, v_uid, now() + make_interval(hours => p_ttl_hours));

  return v_raw_token;
end;
$$;

revoke all on function public.create_invite(uuid, int) from public, anon, authenticated;
grant execute on function public.create_invite(uuid, int) to authenticated;

-- Internal helper to record failed invite redemption attempts (persists because redeem_invite returns status)
create or replace function public.record_failed_invite_attempt(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.invite_redeem_attempts%rowtype;
  v_next_count int;
begin
  select *
    into v_row
  from public.invite_redeem_attempts a
  where a.user_id = p_uid
  for update;

  if not found then
    insert into public.invite_redeem_attempts (user_id, failed_count, window_started_at, locked_until)
    values (p_uid, 1, now(), null);
    return;
  end if;

  if v_row.window_started_at < now() - interval '10 minutes' then
    v_next_count := 1;
    update public.invite_redeem_attempts
    set failed_count = 1,
        window_started_at = now(),
        locked_until = null
    where user_id = p_uid;
  else
    v_next_count := v_row.failed_count + 1;
    update public.invite_redeem_attempts
    set failed_count = v_next_count,
        locked_until = case when v_next_count >= 5 then now() + interval '10 minutes' else null end
    where user_id = p_uid;
  end if;
end;
$$;

revoke all on function public.record_failed_invite_attempt(uuid) from public, anon, authenticated;

-- 3. redeem_invite(p_raw_token) -> atomic single-use redemption with rate-limiting & idempotency
create or replace function public.redeem_invite(p_raw_token text)
returns table (
  status text,
  squad_id uuid,
  squad_name text
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_token text;
  v_hash bytea;
  v_invite public.squad_invites%rowtype;
  v_squad_name text;
  v_is_archived boolean;
  v_locked_until timestamptz;
  v_already_active boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select a.locked_until
    into v_locked_until
  from public.invite_redeem_attempts a
  where a.user_id = v_uid;

  if v_locked_until is not null and v_locked_until > now() then
    return query select 'rate_limited'::text, null::uuid, null::text;
    return;
  end if;

  v_token := btrim(coalesce(p_raw_token, ''));
  if char_length(v_token) < 16 then
    perform public.record_failed_invite_attempt(v_uid);
    return query select 'invalid'::text, null::uuid, null::text;
    return;
  end if;

  v_hash := extensions.digest(convert_to(v_token, 'utf8'), 'sha256');

  select si.*
    into v_invite
  from public.squad_invites si
  where si.token_hash = v_hash
  for update;

  if not found then
    perform public.record_failed_invite_attempt(v_uid);
    return query select 'invalid'::text, null::uuid, null::text;
    return;
  end if;

  select s.name, s.is_archived
    into v_squad_name, v_is_archived
  from public.squads s
  where s.id = v_invite.squad_id;

  if not found or v_is_archived then
    return query select 'invalid'::text, null::uuid, null::text;
    return;
  end if;

  select exists (
    select 1
    from public.squad_members sm
    where sm.squad_id = v_invite.squad_id
      and sm.user_id = v_uid
      and sm.is_active = true
  ) into v_already_active;

  if v_invite.revoked_at is not null then
    perform public.record_failed_invite_attempt(v_uid);
    return query select 'revoked'::text, null::uuid, null::text;
    return;
  end if;

  if v_invite.consumed_at is not null then
    if v_invite.consumed_by = v_uid and v_already_active then
      return query select 'already_member'::text, v_invite.squad_id, v_squad_name;
      return;
    end if;
    perform public.record_failed_invite_attempt(v_uid);
    return query select 'already_used'::text, null::uuid, null::text;
    return;
  end if;

  if v_invite.expires_at <= now() then
    return query select 'expired'::text, null::uuid, null::text;
    return;
  end if;

  if v_already_active then
    return query select 'already_member'::text, v_invite.squad_id, v_squad_name;
    return;
  end if;

  perform public.ensure_my_profile();

  update public.squad_invites
  set consumed_at = now(),
      consumed_by = v_uid
  where id = v_invite.id
    and consumed_at is null
    and revoked_at is null
    and expires_at > now();

  if not found then
    perform public.record_failed_invite_attempt(v_uid);
    return query select 'already_used'::text, null::uuid, null::text;
    return;
  end if;

  insert into public.squad_members (squad_id, user_id, role, is_active, joined_at)
  values (v_invite.squad_id, v_uid, 'member', true, now())
  on conflict (squad_id, user_id)
  do update set
    role = 'member',
    is_active = true,
    joined_at = now();

  insert into public.presence (squad_id, user_id, campus_state, ghost_mode)
  values (v_invite.squad_id, v_uid, 'unknown', false)
  on conflict (squad_id, user_id)
  do update set
    campus_state = 'unknown',
    campus_source = null,
    campus_observed_at = null,
    campus_fresh_until = null,
    manual_override_until = null,
    availability = null,
    availability_source = null,
    availability_updated_at = null,
    availability_expires_at = null,
    zone_id = null,
    zone_source = null,
    zone_updated_at = null,
    zone_expires_at = null,
    note = null,
    ghost_mode = false;

  delete from public.invite_redeem_attempts where user_id = v_uid;
  perform public.touch_squad_feed_signal(v_invite.squad_id);

  return query select 'redeemed'::text, v_invite.squad_id, v_squad_name;
end;
$$;

revoke all on function public.redeem_invite(text) from public, anon, authenticated;
grant execute on function public.redeem_invite(text) to authenticated;

-- 4. get_my_squads() -> caller active non-archived squads
create or replace function public.get_my_squads()
returns table (
  squad_id uuid,
  name text,
  role text,
  joined_at timestamptz,
  member_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id as squad_id,
    s.name,
    mine.role,
    mine.joined_at,
    (
      select count(*)
      from public.squad_members peer
      where peer.squad_id = s.id
        and peer.is_active = true
    ) as member_count
  from public.squad_members mine
  join public.squads s on s.id = mine.squad_id
  where mine.user_id = auth.uid()
    and mine.is_active = true
    and s.is_archived = false
  order by mine.joined_at desc;
$$;

revoke all on function public.get_my_squads() from public, anon, authenticated;
grant execute on function public.get_my_squads() to authenticated;

-- 5. get_squad_members(p_squad_id) -> active member list for authorized member
create or replace function public.get_squad_members(p_squad_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  role text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if auth.uid() is null then
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
    sm.joined_at
  from public.squad_members sm
  join public.profiles p on p.id = sm.user_id
  where sm.squad_id = p_squad_id
    and sm.is_active = true
  order by
    case when sm.role = 'owner' then 0 else 1 end,
    sm.joined_at asc;
end;
$$;

revoke all on function public.get_squad_members(uuid) from public, anon, authenticated;
grant execute on function public.get_squad_members(uuid) to authenticated;

-- 6. list_squad_invites(p_squad_id) -> owner-only metadata list (never exposes token_hash)
create or replace function public.list_squad_invites(p_squad_id uuid)
returns table (
  id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  consumed_at timestamptz,
  revoked_at timestamptz,
  status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_owner(p_squad_id) then
    raise exception 'Only the squad owner can view invitations' using errcode = '42501';
  end if;

  return query
  select
    si.id,
    si.created_at,
    si.expires_at,
    si.consumed_at,
    si.revoked_at,
    case
      when si.revoked_at is not null then 'revoked'
      when si.consumed_at is not null then 'used'
      when si.expires_at <= now() then 'expired'
      else 'active'
    end as status
  from public.squad_invites si
  where si.squad_id = p_squad_id
  order by si.created_at desc, si.id desc
  limit 25;
end;
$$;

revoke all on function public.list_squad_invites(uuid) from public, anon, authenticated;
grant execute on function public.list_squad_invites(uuid) to authenticated;

-- 7. revoke_invite(p_invite_id) -> owner revokes pending invite
create or replace function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_squad_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select si.squad_id
    into v_squad_id
  from public.squad_invites si
  where si.id = p_invite_id;

  if not found or not public.is_active_squad_owner(v_squad_id) then
    raise exception 'Only the squad owner can revoke this invitation' using errcode = '42501';
  end if;

  update public.squad_invites
  set revoked_at = now()
  where id = p_invite_id
    and revoked_at is null
    and consumed_at is null;
end;
$$;

revoke all on function public.revoke_invite(uuid) from public, anon, authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;

-- 8. remove_member(p_squad_id, p_target_user_id) -> owner removes non-owner member immediately
create or replace function public.remove_member(p_squad_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_target_role text;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_owner(p_squad_id) then
    raise exception 'Only the squad owner can remove members' using errcode = '42501';
  end if;

  if p_target_user_id is null or p_target_user_id = v_uid then
    raise exception 'Use Leave Squad to exit your own membership' using errcode = '22023';
  end if;

  select sm.role
    into v_target_role
  from public.squad_members sm
  where sm.squad_id = p_squad_id
    and sm.user_id = p_target_user_id
    and sm.is_active = true;

  if not found then
    raise exception 'Target user is not an active member of this squad' using errcode = 'P0002';
  end if;

  if v_target_role = 'owner' then
    raise exception 'Cannot remove a squad owner' using errcode = '42501';
  end if;

  delete from public.presence
  where squad_id = p_squad_id and user_id = p_target_user_id;

  delete from public.notification_preferences
  where squad_id = p_squad_id and user_id = p_target_user_id;

  delete from public.squad_members
  where squad_id = p_squad_id and user_id = p_target_user_id;

  perform public.touch_squad_feed_signal(p_squad_id);
end;
$$;

revoke all on function public.remove_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;

-- 9. leave_squad(p_squad_id) -> caller leaves squad; deletes presence immediately
create or replace function public.leave_squad(p_squad_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_other_members int;
  v_other_owners int;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select sm.role
    into v_role
  from public.squad_members sm
  where sm.squad_id = p_squad_id
    and sm.user_id = v_uid
    and sm.is_active = true;

  if not found then
    raise exception 'You are not an active member of this squad' using errcode = 'P0002';
  end if;

  select
    count(*) filter (where sm.user_id <> v_uid),
    count(*) filter (where sm.user_id <> v_uid and sm.role = 'owner')
    into v_other_members, v_other_owners
  from public.squad_members sm
  where sm.squad_id = p_squad_id
    and sm.is_active = true;

  if v_role = 'owner' and v_other_members > 0 and v_other_owners = 0 then
    raise exception 'Transfer ownership or remove other members before leaving the squad' using errcode = 'P0001';
  end if;

  delete from public.presence
  where squad_id = p_squad_id and user_id = v_uid;

  delete from public.notification_preferences
  where squad_id = p_squad_id and user_id = v_uid;

  delete from public.squad_members
  where squad_id = p_squad_id and user_id = v_uid;

  if v_other_members = 0 then
    delete from public.squads where id = p_squad_id;
  else
    perform public.touch_squad_feed_signal(p_squad_id);
  end if;
end;
$$;

revoke all on function public.leave_squad(uuid) from public, anon, authenticated;
grant execute on function public.leave_squad(uuid) to authenticated;

-- 10. transfer_ownership(p_squad_id, p_new_owner_user_id)
create or replace function public.transfer_ownership(p_squad_id uuid, p_new_owner_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_owner(p_squad_id) then
    raise exception 'Only the squad owner can transfer ownership' using errcode = '42501';
  end if;

  if p_new_owner_user_id is null or p_new_owner_user_id = v_uid then
    raise exception 'Choose another active member as the new owner' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.squad_members sm
    where sm.squad_id = p_squad_id
      and sm.user_id = p_new_owner_user_id
      and sm.is_active = true
  ) then
    raise exception 'Target user is not an active member of this squad' using errcode = 'P0002';
  end if;

  update public.squad_members
  set role = 'owner'
  where squad_id = p_squad_id and user_id = p_new_owner_user_id;

  update public.squad_members
  set role = 'member'
  where squad_id = p_squad_id and user_id = v_uid;
end;
$$;

revoke all on function public.transfer_ownership(uuid, uuid) from public, anon, authenticated;
grant execute on function public.transfer_ownership(uuid, uuid) to authenticated;

-- 11. delete_squad(p_squad_id)
create or replace function public.delete_squad(p_squad_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_active_squad_owner(p_squad_id) then
    raise exception 'Only the squad owner can delete this squad' using errcode = '42501';
  end if;

  delete from public.squads where id = p_squad_id;
end;
$$;

revoke all on function public.delete_squad(uuid) from public, anon, authenticated;
grant execute on function public.delete_squad(uuid) to authenticated;

commit;
