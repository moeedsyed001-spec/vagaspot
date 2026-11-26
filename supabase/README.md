# VAGASPOT Supabase Migrations & Verification

## 1. Migration order (apply in Supabase SQL Editor)

Apply these files in exact order inside **Supabase Dashboard → SQL Editor**:

1. `supabase/migrations/0001_extensions_and_core_schema.sql`
   - Enables `pgcrypto` in `extensions`, creates all core tables, triggers, hardened `presence` Ghost/expiry constraints, `squad_feed_signals`, `invite_redeem_attempts`, enables RLS on every table, and revokes default grants.
2. `supabase/migrations/0002_rls_and_profile_auth.sql`
   - Creates `SECURITY DEFINER` non-recursive membership helpers (`is_active_squad_member`, `shares_active_squad_with`), `auth.users` profile bootstrap trigger (`handle_new_user`), `ensure_my_profile()` / `update_my_profile(text)` RPCs, narrow column grants, and strict RLS policies.

## 2. Two-user RLS SQL verification (disposable transaction)

Run `supabase/tests/02_rls_two_user_test.sql` in **Supabase SQL Editor**:
- It is wrapped in `begin; ... rollback;` so synthetic test rows are rolled back automatically.
- Look for `NOTICE: ALL PHASE 2 RLS & PROFILE TESTS PASSED`.

## 3. Live two-account browser check

1. Sign in with **Account A** via `http://localhost:5173/auth` (`Continue with Google`).
2. Confirm `Settings` shows your Google display name/avatar and lets you update `Display name` (1–50 chars).
3. Sign out and verify protected routes (`/squad`, `/settings`) redirect to `/auth`.
4. Sign in with **Account B** in an incognito window:
   - Confirm Account B sees only Account B's profile (`profiles` returns 1 row), cannot read Account A's profile, and cannot read `presence` or `squad_invites` directly.
   - Verify unauthenticated `anon` REST queries to `/rest/v1/profiles`, `/rest/v1/squads`, and `/rest/v1/presence` are rejected (`401`/`403`).
