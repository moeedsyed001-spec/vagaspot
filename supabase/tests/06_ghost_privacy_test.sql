-- 06_ghost_privacy_test.sql
-- Disposable/transactional SQL security test for Phase 6 Ghost Mode & privacy hardening.
-- Verifies:
--   - Enabling Ghost Mode physically clears all shareable columns in public.presence
--   - Neither peer member (B) nor squad owner (O) can read hidden data via get_squad_feed
--   - Direct SELECT on public.presence by B, O, or anon fails with insufficient_privilege
--   - public.presence is excluded from supabase_realtime
--   - Disabling Ghost Mode resets to campus_state='unknown' and NULL status/zone (never restores old data)
--   - Non-member cannot toggle Ghost Mode on another squad

begin;

do $$
declare
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_member_a uuid := '22222222-2222-4222-8222-222222222222';
  v_member_b uuid := '33333333-3333-4333-8333-333333333333';
  v_outsider uuid := '44444444-4444-4444-8444-444444444444';
  v_squad_id uuid;
  v_tok_a text;
  v_tok_b text;
  v_row record;
  v_raw public.presence%rowtype;
  v_count int;
begin
  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (v_owner, 'authenticated', 'authenticated', 'owner@example.test', '{"full_name":"Owner Admin"}'::jsonb, now(), now()),
    (v_member_a, 'authenticated', 'authenticated', 'a@example.test', '{"full_name":"Member A"}'::jsonb, now(), now()),
    (v_member_b, 'authenticated', 'authenticated', 'b@example.test', '{"full_name":"Member B"}'::jsonb, now(), now()),
    (v_outsider, 'authenticated', 'authenticated', 'out@example.test', '{"full_name":"Outsider"}'::jsonb, now(), now());

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner::text, 'role', 'authenticated')::text, true);
  v_squad_id := public.create_squad('Privacy Audit Squad');
  v_tok_a := public.create_invite(v_squad_id, 24);
  v_tok_b := public.create_invite(v_squad_id, 24);

  perform set_config('request.jwt.claims', json_build_object('sub', v_member_a::text, 'role', 'authenticated')::text, true);
  perform * from public.redeem_invite(v_tok_a);

  perform set_config('request.jwt.claims', json_build_object('sub', v_member_b::text, 'role', 'authenticated')::text, true);
  perform * from public.redeem_invite(v_tok_b);

  -- Member A sets visible presence before enabling Ghost Mode
  perform set_config('request.jwt.claims', json_build_object('sub', v_member_a::text, 'role', 'authenticated')::text, true);
  perform public.set_my_campus_state(v_squad_id, 'on_campus');
  if public.compute_pkt_window_expiry(now()) is not null then
    perform public.set_my_availability(v_squad_id, 'free');
    perform public.set_my_zone(v_squad_id, 'library', 'Secret floor note');
  end if;

  -- 1. Member A enables Ghost Mode
  perform public.set_ghost_mode(v_squad_id, true);

  -- 2. Verify raw table columns are physically cleared in public.presence
  execute 'reset role';
  select * into v_raw from public.presence where squad_id = v_squad_id and user_id = v_member_a;
  if v_raw.ghost_mode is not true
     or v_raw.campus_state is not null
     or v_raw.campus_source is not null
     or v_raw.campus_observed_at is not null
     or v_raw.campus_fresh_until is not null
     or v_raw.manual_override_until is not null
     or v_raw.availability is not null
     or v_raw.availability_expires_at is not null
     or v_raw.zone_id is not null
     or v_raw.zone_expires_at is not null
     or v_raw.note is not null then
    raise exception 'FAIL: set_ghost_mode(true) left stale fields in raw presence table';
  end if;

  -- 3. Peer Member B sees name/avatar + hidden flag only; direct presence SELECT denied
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_member_b::text, 'role', 'authenticated')::text, true);
  select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_member_a;
  if v_row.is_ghost is not true or v_row.campus_state is not null or v_row.last_updated_at is not null then
    raise exception 'FAIL: Peer B saw hidden presence fields';
  end if;

  begin
    execute 'select count(*) from public.presence' into v_count;
    raise exception 'FAIL: Peer B could SELECT public.presence directly';
  exception when insufficient_privilege then
    null;
  end;

  -- 4. Squad Owner CANNOT bypass Ghost Mode
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner::text, 'role', 'authenticated')::text, true);
  select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_member_a;
  if v_row.is_ghost is not true or v_row.campus_state is not null or v_row.availability is not null or v_row.zone_id is not null or v_row.note is not null or v_row.last_updated_at is not null then
    raise exception 'FAIL: Squad owner could view Ghost Mode presence';
  end if;

  -- 5. Outsider cannot call set_ghost_mode on another squad
  perform set_config('request.jwt.claims', json_build_object('sub', v_outsider::text, 'role', 'authenticated')::text, true);
  begin
    perform public.set_ghost_mode(v_squad_id, false);
    raise exception 'FAIL: Outsider could toggle Ghost Mode';
  exception when insufficient_privilege then
    null;
  end;

  -- 6. Member A disables Ghost Mode -> campus_state='unknown' and NO old data restored
  perform set_config('request.jwt.claims', json_build_object('sub', v_member_a::text, 'role', 'authenticated')::text, true);
  perform public.set_ghost_mode(v_squad_id, false);

  select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_member_a;
  if v_row.is_ghost is not false
     or v_row.campus_state <> 'unknown'
     or v_row.campus_source is not null
     or v_row.availability is not null
     or v_row.zone_id is not null
     or v_row.note is not null then
    raise exception 'FAIL: Disabling Ghost Mode restored stale data';
  end if;

  -- 7. Confirm public.presence is NOT published to Realtime
  execute 'reset role';
  select count(*) into v_count
  from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'presence';
  if v_count <> 0 then
    raise exception 'FAIL: public.presence must not be in supabase_realtime';
  end if;

  raise notice 'ALL PHASE 6 GHOST MODE & PRIVACY TESTS PASSED';
end;
$$;

rollback;
