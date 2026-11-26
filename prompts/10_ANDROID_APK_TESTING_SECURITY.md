# Prompt 10 — Capacitor Android APK, hardening and QA

**Feed:** `AGENTS.md`, `docs/03_SYSTEM_ARCHITECTURE.md`, `docs/10_TESTING_AND_ACCEPTANCE.md`, `docs/11_ZERO_COST_DEPLOYMENT_AND_OPERATIONS.md`, `docs/15_OPEN_ITEMS.md`.

## Task prompt

Wrap the working web app using the compatible current stable Capacitor Android package. Configure app ID/name/icon, OAuth deep links and only required Android permissions. Do not add background location permission in MVP; it belongs to optional Release 2 after opt-in disclosure and campus polygon approval. Build debug and release APK locally. Do not commit signing keystore or passwords.

Run the full MVP test plan: OAuth, two-user invite/feed, RLS, Ghost Mode direct API leakage, expiry in Asia/Karachi, offline/reconnect, responsive screens, direct APK install and update. Remove debug/test shortcuts, sample credentials and console logging of secrets. Produce a release checklist, exact commands and APK distribution instructions. Do not implement geofencing unless Prompt 08 gates are satisfied.

## Checks

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- `npx cap sync android`.
- Build debug APK and signed release APK using local keystore.
- Test on physical device (target model to be specified).
- Inspect bundle/APK and Git history for secrets.
- Record all open defects and don't call release done with critical privacy/RLS defects.
