-- 05_checkin_expiry_test.sql
-- Disposable/transactional SQL verification script for Phase 5.
-- Tests:
--   - T-BR-01: 10:00 PKT -> 12:00 PKT
--   - T-BR-02: 17:30 PKT -> 18:00 PKT
--   - T-BR-03: 18:15 PKT -> NULL (closed); 00:05 PKT -> 02:05 PKT (reopened)
--   - T-BR-09/10: invalid/inactive zone and >60 char note rejected
--   - Changing campus_state to on_campus preserves active availability/zone
--   - Changing campus_state to off_campus clears availability, zone, and note

begin;

do $$
declare
  v_user uuid := '11111111-1111-4111-8111-111111111111';
  v_squad_id uuid;
  v_exp timestamptz;
  v_row record;
  v_active_zones int;
begin
  -- 1. Pure PKT expiry boundary tests (timezone-independent)
  v_exp := public.compute_pkt_window_expiry('2026-11-26 10:00:00+05'::timestamptz);
  if v_exp <> '2026-11-26 12:00:00+05'::timestamptz then
    raise exception 'FAIL T-BR-01: expected 12:00 PKT, got %', v_exp;
  end if;

  v_exp := public.compute_pkt_window_expiry('2026-11-26 17:30:00+05'::timestamptz);
  if v_exp <> '2026-11-26 18:00:00+05'::timestamptz then
    raise exception 'FAIL T-BR-02: expected 18:00 PKT, got %', v_exp;
  end if;

  v_exp := public.compute_pkt_window_expiry('2026-11-26 18:15:00+05'::timestamptz);
  if v_exp is not null then
    raise exception 'FAIL T-BR-03: expected NULL at 18:15 PKT, got %', v_exp;
  end if;

  v_exp := public.compute_pkt_window_expiry('2026-11-27 00:05:00+05'::timestamptz);
  if v_exp <> '2026-11-27 02:05:00+05'::timestamptz then
    raise exception 'FAIL: expected 02:05 PKT after midnight reopen, got %', v_exp;
  end if;

  -- 2. Seed test user & squad
  insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (v_user, 'authenticated', 'authenticated', 'checkin@example.test', '{"full_name":"Checkin Tester"}'::jsonb, now(), now());

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', v_user::text, 'role', 'authenticated')::text, true);

  v_squad_id := public.create_squad('Checkin Squad');

  -- Confirm restricted utility zones are inactive while student zones are active
  select count(*) into v_active_zones from public.campus_zones where is_active = true;
  if v_active_zones < 20 then
    raise exception 'FAIL: expected >= 20 active student zones, got %', v_active_zones;
  end if;

  -- 3. Invalid / inactive zone rejected (T-BR-09)
  begin
    perform public.set_my_zone(v_squad_id, 'ht-panel-room', 'Testing restricted room');
    raise exception 'FAIL T-BR-09: inactive utility zone was accepted';
  exception when invalid_parameter_value then
    null; -- expected 22023
  end;

  begin
    perform public.set_my_zone(v_squad_id, 'nonexistent-zone', null);
    raise exception 'FAIL T-BR-09: unknown zone was accepted';
  exception when invalid_parameter_value then
    null; -- expected 22023
  end;

  -- 4. Note > 60 chars rejected (T-BR-10)
  begin
    perform public.set_my_zone(v_squad_id, 'library', repeat('x', 61));
    raise exception 'FAIL T-BR-10: note > 60 chars was accepted';
  exception when invalid_parameter_value then
    null; -- expected 22023
  end;

  -- 5. Campus state on_campus sets manual source and 8h freshness, preserving other fields
  perform public.set_my_campus_state(v_squad_id, 'on_campus');
  select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_user;
  if v_row.campus_state <> 'on_campus' or v_row.campus_source <> 'manual' then
    raise exception 'FAIL: set_my_campus_state(on_campus) mismatch';
  end if;

  -- If current PKT time is before 18:00, also test live set_my_availability + set_my_zone + off_campus clear
  if public.compute_pkt_window_expiry(now()) is not null then
    perform public.set_my_availability(v_squad_id, 'free');
    perform public.set_my_zone(v_squad_id, 'library', 'Near quiet corner');
    perform public.set_my_campus_state(v_squad_id, 'on_campus');

    select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_user;
    if v_row.availability <> 'free' or v_row.zone_id <> 'library' or v_row.note <> 'Near quiet corner' then
      raise exception 'FAIL: setting campus_state=on_campus modified availability/zone';
    end if;

    perform public.set_my_campus_state(v_squad_id, 'off_campus');
    select * into v_row from public.get_squad_feed(v_squad_id) f where f.user_id = v_user;
    if v_row.campus_state <> 'off_campus' or v_row.availability is not null or v_row.zone_id is not null or v_row.note is not null then
      raise exception 'FAIL: setting off_campus did not clear availability/zone/note';
    end if;
  end if;

  raise notice 'ALL PHASE 5 CHECK-IN & EXPIRY TESTS PASSED';
end;
$$;

rollback;
