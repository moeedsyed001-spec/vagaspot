# Prompt 02 — Supabase schema, RLS and Google OAuth

**Use in:** repository-aware coding AI + Supabase SQL Editor.  
**Feed:** `AGENTS.md`, `docs/00_DECISION_REGISTER.md`, `docs/02_USER_STORIES_AND_BUSINESS_RULES.md`, `docs/03_SYSTEM_ARCHITECTURE.md`, `docs/04_DATABASE_AND_PRESENCE_SPEC.md`, `database/0001_schema_blueprint.sql`, `database/0002_rpc_contracts.md`.

## Task prompt

Implement the reviewed Supabase schema and authentication integration. First inspect repository and starter SQL. Do not blindly execute or copy the blueprint as production-ready. Produce ordered SQL migrations for core tables, indexes, required helper triggers and secure RLS policies. RLS must be enabled on every exposed table; default deny. Do not add permissive `USING (true)` policies. Use a fixed safe search_path for any security-definer function, validate `auth.uid()` and membership/role, and avoid RLS recursion.

For this task implement only profile bootstrap, Google OAuth sign-in/out/session restoration, protected routes and profile read/update for own display name. If full Google OAuth credentials are unavailable, provide correct configuration instructions and a safe local placeholder; do not fake successful login. Configure redirect handling for web first. Document Android deep-link callback for a later task.

Create SQL tests or an explicit two-user verification script/checklist. Do not implement invites, presence, FCM or geofencing in this task.

## Checks

- Apply migrations in a disposable/local environment or inspect SQL carefully before dashboard execution.
- Sign in with two test accounts.
- Verify profile self-update only.
- Attempt unauthorized reads/updates with anon, unrelated user and authenticated user.
- `npm run typecheck`, tests and build.

Return migration order, exact dashboard steps, RLS test results and any unresolved Supabase settings.
