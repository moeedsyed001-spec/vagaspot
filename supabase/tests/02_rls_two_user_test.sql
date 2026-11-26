-- 02_rls_two_user_test.sql
-- Disposable/transactional SQL verification script for Phase 2.
-- Safe to run in Supabase SQL Editor: wraps everything in BEGIN ... ROLLBACK so no test data persists.
-- Tests anon, User A, User B (shared squad), and User C (unrelated user).

begin;

do $$
declare
  v_user_a uuid := '11111111-1111-4111-8111-111111111111';
  v_user_b uuid := '22222222-2222-4222-8222-222222222222';
  v_user_c uuid := '33333333-3333-4333-8333-333333333333';
  v_squad_ab uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_count int;
  v_name text;
begin
  -- 1. Seed three synthetic auth.users rows (trigger should auto-create profiles)
  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (v_user_a, 'authenticated', 'authenticated', 'usera@example.test', '{"full_name":"Alice Tester"}'::jsonb, now(), now()),
    (v_user_b, 'authenticated', 'authenticated', 'userb@example.test', '{"full_name":"Bilal Tester"}'::jsonb, now(), now()),
    (v_user_c, 'authenticated', 'authenticated', 'userc@example.test', '{"full_name":"Charlie Outsider"}'::jsonb, now(), now());

  select count(*) into v_count from public.profiles where id in (v_user_a, v_user_b, v_user_c);
  if v_count <> 3 then
    raise exception 'FAIL: Expected 3 auto-bootstrapped profiles, found %', v_count;
  end if;

  -- Put A and B in one squad; C is outside
  insert into public.squads (id, name, created_by) values (v_squad_ab, 'Test Squad', v_user_a);
  insert into public.squad_members (squad_id, user_id, role, is_active)
  values
    (v_squad_ab, v_user_a, 'owner', true),
    (v_squad_ab, v_user_b, 'member', true);

  -- 2. Verify ANON has zero access
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{}', true);

  begin
    execute 'select count(*) from public.profiles' into v_count;
    raise exception 'FAIL: anon was allowed to query public.profiles';
  exception when insufficient_privilege then
    null; -- expected
  end;

  begin
    execute 'select count(*) from public.presence' into v_count;
    raise exception 'FAIL: anon was allowed to query public.presence';
  exception when insufficient_privilege then
    null; -- expected
  end;

  -- 3. Verify User C (unrelated authenticated user) sees only own profile and zero squads
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_c::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.profiles;
  if v_count <> 1 then
    raise exception 'FAIL: Unrelated User C saw % profiles (expected 1)', v_count;
  end if;

  select count(*) into v_count from public.squads;
  if v_count <> 0 then
    raise exception 'FAIL: Unrelated User C saw % squads (expected 0)', v_count;
  end if;

  -- User C cannot update User A profile
  update public.profiles set display_name = 'Hacked' where id = v_user_a;
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'FAIL: User C updated User A profile';
  end if;

  -- 4. Verify User A sees self + peer B (not C), and can update own display_name only
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);

  select count(*) into v_count from public.profiles;
  if v_count <> 2 then
    raise exception 'FAIL: User A saw % profiles (expected 2: self + peer B)', v_count;
  end if;

  select d.display_name into v_name from public.update_my_profile('Alice Updated') d;
  if v_name <> 'Alice Updated' then
    raise exception 'FAIL: update_my_profile returned %', v_name;
  end if;

  -- User A cannot directly SELECT presence or squad_invites
  begin
    execute 'select count(*) from public.presence' into v_count;
    raise exception 'FAIL: Authenticated user was allowed to SELECT raw presence';
  exception when insufficient_privilege then
    null; -- expected
  end;

  begin
    execute 'select count(*) from public.squad_invites' into v_count;
    raise exception 'FAIL: Authenticated user was allowed to SELECT squad_invites';
  exception when insufficient_privilege then
    null; -- expected
  end;

  -- User A cannot tamper with auto_detection_enabled directly
  begin
    execute 'update public.profiles set auto_detection_enabled = true where id = $1' using v_user_a;
    raise exception 'FAIL: Authenticated user updated auto_detection_enabled directly';
  exception when insufficient_privilege then
    null; -- expected
  end;

  raise notice 'ALL PHASE 2 RLS & PROFILE TESTS PASSED';
end;
$$;

rollback;
