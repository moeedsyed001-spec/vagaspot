# VAGASPOT Supabase Migrations & Verification

## 1. Migration order (apply in Supabase SQL Editor)

Apply these files in exact order inside **Supabase Dashboard → SQL Editor**:

1. `supabase/migrations/0001_extensions_and_core_schema.sql`
   - Enables `pgcrypto` in `extensions`, creates all core tables, triggers, hardened `presence` Ghost/expiry constraints, `squad_feed_signals`, `invite_redeem_attempts`, enables RLS on every table, and revokes default grants.
2. `supabase/migrations/0002_rls_and_profile_auth.sql`
   - Creates `SECURITY DEFINER` non-recursive membership helpers (`is_active_squad_member`, `shares_active_squad_with`), `auth.users` profile bootstrap trigger (`handle_new_user`), `ensure_my_profile()` / `update_my_profile(text)` RPCs, narrow column grants, and strict RLS policies.
3. `supabase/migrations/0003_squads_and_invites.sql`
   - Creates Phase 3 squad & invite RPCs (`create_squad`, `create_invite`, `redeem_invite`, `get_my_squads`, `get_squad_members`, `list_squad_invites`, `revoke_invite`, `remove_member`, `leave_squad`, `transfer_ownership`, `delete_squad`).
4. `supabase/migrations/0004_feed_and_realtime.sql`
   - Creates `get_squad_feed(p_squad_id)` (Ghost Mode redaction, 8h campus freshness, shared expiry), `profiles` display-name signal trigger, and publishes only `public.squad_feed_signals` to `supabase_realtime`.

## 2. RLS & Invite SQL verification (disposable transaction)

Run these scripts in **Supabase SQL Editor** (wrapped in `begin; ... rollback;` so synthetic test rows do not persist):
- `supabase/tests/02_rls_two_user_test.sql` → `NOTICE: ALL PHASE 2 RLS & PROFILE TESTS PASSED`
- `supabase/tests/03_squads_invites_test.sql` → `NOTICE: ALL PHASE 3 SQUAD & INVITE TESTS PASSED`
- `supabase/tests/04_feed_realtime_test.sql` → `NOTICE: ALL PHASE 4 FEED & REALTIME TESTS PASSED`

## 3. Live two-account browser check

1. Sign in with **Account A** via `http://localhost:5173/auth` (`Continue with Google`).
2. Confirm `Settings` shows your Google display name/avatar and lets you update `Display name` (1–50 chars).
3. Sign out and verify protected routes (`/squad`, `/settings`) redirect to `/auth`.
4. Sign in with **Account B** in an incognito window:
   - Confirm Account B sees only Account B's profile (`profiles` returns 1 row), cannot read Account A's profile, and cannot read `presence` or `squad_invites` directly.
   - Verify unauthenticated `anon` REST queries to `/rest/v1/profiles`, `/rest/v1/squads`, and `/rest/v1/presence` are rejected (`401`/`403`).
