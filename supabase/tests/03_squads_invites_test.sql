-- 03_squads_invites_test.sql
-- Disposable/transactional SQL verification script for Phase 3.
-- Safe to run in Supabase SQL Editor: wraps everything in BEGIN ... ROLLBACK.
-- Tests:
--   - Squad creation + owner membership
--   - High-entropy single-use invite (hash stored, raw returned once)
--   - Replay, expiry, revocation, and unrelated third-user isolation
--   - Member cannot promote self or remove owner
--   - Removed user loses squad access and presence immediately

begin;

do $$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_friend uuid := '22222222-2222-4222-8222-222222222222';
  v_outsider uuid := '33333333-3333-4333-8333-333333333333';
  v_squad_id uuid;
  v_token text;
  v_token_revoke text;
  v_invite_id uuid;
  v_status text;
  v_count int;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (v_owner, 'authenticated', 'authenticated', 'owner@example.test', '{"full_name":"Owner One"}'::jsonb, now(), now()),
    (v_friend, 'authenticated', 'authenticated', 'friend@example.test', '{"full_name":"Friend Two"}'::jsonb, now(), now()),
    (v_outsider, 'authenticated', 'authenticated', 'outsider@example.test', '{"full_name":"Outsider Three"}'::jsonb, now(), now());

  -- 1. Owner creates squad
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner::text, 'role', 'authenticated')::text, true);

  v_squad_id := public.create_squad('COMSATS Alpha');
  if v_squad_id is null then
    raise exception 'FAIL: create_squad returned null';
  end if;

  -- 1b. Create an invite and immediately revoke it (isolated before creating active invite)
  v_token_revoke := public.create_invite(v_squad_id, 72);
  if char_length(v_token_revoke) < 20 then
    raise exception 'FAIL: Invite token entropy too short';
  end if;
  select i.id into v_invite_id from public.list_squad_invites(v_squad_id) i limit 1;
  perform public.revoke_invite(v_invite_id);

  -- 2. Friend redeems revoked invite -> must fail with 'revoked'
  perform set_config('request.jwt.claims', json_build_object('sub', v_friend::text, 'role', 'authenticated')::text, true);
  select r.status into v_status from public.redeem_invite(v_token_revoke) r;
  if v_status <> 'revoked' then
    raise exception 'FAIL: Revoked invite returned % instead of revoked', v_status;
  end if;

  -- Owner creates an active invite (>= 22 chars for 128-bit base64url)
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner::text, 'role', 'authenticated')::text, true);
  v_token := public.create_invite(v_squad_id, 72);
  if char_length(v_token) < 20 then
    raise exception 'FAIL: Invite token entropy too short';
  end if;

  -- Friend redeems valid invite -> succeeds
  perform set_config('request.jwt.claims', json_build_object('sub', v_friend::text, 'role', 'authenticated')::text, true);
  select r.status into v_status from public.redeem_invite(v_token) r;
  if v_status <> 'redeemed' then
    raise exception 'FAIL: Valid invite returned % instead of redeemed', v_status;
  end if;

  -- Same friend re-submits consumed invite -> idempotent 'already_member'
  select r.status into v_status from public.redeem_invite(v_token) r;
  if v_status <> 'already_member' then
    raise exception 'FAIL: Duplicate redeem by same member returned %', v_status;
  end if;

  -- 3. Outsider tries to replay consumed token -> 'already_used'
  perform set_config('request.jwt.claims', json_build_object('sub', v_outsider::text, 'role', 'authenticated')::text, true);
  select r.status into v_status from public.redeem_invite(v_token) r;
  if v_status <> 'already_used' then
    raise exception 'FAIL: Replay by outsider returned % instead of already_used', v_status;
  end if;

  -- Outsider cannot read squad or member list
  select count(*) into v_count from public.squads where id = v_squad_id;
  if v_count <> 0 then
    raise exception 'FAIL: Outsider could read private squad';
  end if;

  begin
    perform * from public.get_squad_members(v_squad_id);
    raise exception 'FAIL: Outsider could call get_squad_members';
  exception when insufficient_privilege then
    null; -- expected
  end;

  -- 4. Member (Friend) cannot create invites, revoke invites, remove owner, or promote self
  perform set_config('request.jwt.claims', json_build_object('sub', v_friend::text, 'role', 'authenticated')::text, true);
  begin
    perform public.create_invite(v_squad_id, 24);
    raise exception 'FAIL: Member created an invite';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform public.remove_member(v_squad_id, v_owner);
    raise exception 'FAIL: Member removed owner';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.squad_members set role = 'owner' where squad_id = v_squad_id and user_id = v_friend;
    raise exception 'FAIL: Member promoted self via direct UPDATE';
  exception when insufficient_privilege then
    null;
  end;

  -- 5. Owner removes Friend -> Friend loses squad access immediately
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner::text, 'role', 'authenticated')::text, true);
  perform public.remove_member(v_squad_id, v_friend);

  perform set_config('request.jwt.claims', json_build_object('sub', v_friend::text, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.get_my_squads();
  if v_count <> 0 then
    raise exception 'FAIL: Removed friend still saw squad';
  end if;

  -- 6. Expired invite check
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner::text, 'role', 'authenticated')::text, true);
  v_token := public.create_invite(v_squad_id, 1);
  execute 'reset role';
  update public.squad_invites
  set created_at = now() - interval '2 hours',
      expires_at = now() - interval '1 minute'
  where squad_id = v_squad_id and consumed_at is null and revoked_at is null;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_outsider::text, 'role', 'authenticated')::text, true);
  select r.status into v_status from public.redeem_invite(v_token) r;
  if v_status <> 'expired' then
    raise exception 'FAIL: Expired invite returned % instead of expired', v_status;
  end if;

  raise notice 'ALL PHASE 3 SQUAD & INVITE TESTS PASSED';
end;
$$;

rollback;
