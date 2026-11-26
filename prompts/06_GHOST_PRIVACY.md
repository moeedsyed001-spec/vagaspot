# Prompt 06 — Ghost Mode and privacy hardening

**Feed:** `AGENTS.md`, `docs/02_USER_STORIES_AND_BUSINESS_RULES.md` (BR-05/08/12/17), `docs/04_DATABASE_AND_PRESENCE_SPEC.md` (RLS and data lifecycle), `docs/05_SCREENS_AND_NAVIGATION.md`.

## Task prompt

Implement Ghost Mode as a secure server-side state transition. When enabled, retain profile name/avatar and squad membership but clear campus state/source/timestamps, availability/source/expiry, zone/source/expiry and note from the shared presence row in one transaction. Peer feed should render only name/avatar and “Presence hidden”. The signed-in owner may see their own Ghost Mode setting, but no peer or owner/admin role may inspect their previous presence.

When Ghost Mode is disabled, set campus state to Unknown or blank and clear availability/zone. Do not restore cached previous data. Add immediate UI feedback only after server confirms; if request fails, revert toggle and explain. Clear/refresh client caches when Ghost Mode changes.

Audit every read path (RPC, table select, Realtime, cache, notifications) for hidden-state leakage. Do not rely on CSS/conditional rendering as security.

## Checks

- Two accounts: enable Ghost Mode on A; B sees name/avatar and hidden indicator only.
- Direct REST/API queries as B cannot retrieve old values.
- Realtime payload contains no old values.
- Admin cannot read hidden status.
- Toggle off does not restore old data.
- Typecheck, tests, build and write a concise security test report.
