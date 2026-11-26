# MASTER PROMPT — Build VAGASPOT without violating its requirements

You are a senior full-stack engineer, security-conscious architect and practical product engineer. Build **VAGASPOT**, a small private campus-presence app for 6–10 friends at COMSATS University Islamabad. This is not an enterprise application. Work feature by feature and do not generate the entire application in one unreviewable change.

## 1. Mandatory input files

Read these before coding:
- `AGENTS.md`
- `docs/00_DECISION_REGISTER.md`
- `docs/01_PRODUCT_REQUIREMENTS.md`
- `docs/02_USER_STORIES_AND_BUSINESS_RULES.md`
- `docs/03_SYSTEM_ARCHITECTURE.md`
- `docs/04_DATABASE_AND_PRESENCE_SPEC.md`
- `docs/05_SCREENS_AND_NAVIGATION.md`
- `docs/06_USER_FLOWS.md`
- `docs/07_BRAND_AND_DESIGN_SYSTEM.md`
- `docs/08_LOCATION_AND_GEOFENCING.md`
- `docs/09_NOTIFICATIONS.md`
- `docs/10_TESTING_AND_ACCEPTANCE.md`
- `docs/11_ZERO_COST_DEPLOYMENT_AND_OPERATIONS.md`
- `docs/13_TRACEABILITY_MATRIX.md`

Also inspect existing repository files before making changes. These documents are the source of truth. If two documents conflict, report it and prefer Decision Register + Business Rules until product owner resolves it.

## 2. Product objective

Friends can see whether each other is on campus, where a friend last manually checked in, and whether the friend is available. The app uses minimal presence state, not continuous tracking. Android automatic campus entry/exit is an optional later release; the first release must work entirely with manual updates.

## 3. Required stack

- React + TypeScript strict mode + Vite.
- Responsive web SPA and Android wrapper using Capacitor.
- Kotlin custom Capacitor plugin around native Android GeofencingClient only in Release 2.
- Supabase PostgreSQL + Auth + RLS + RPC + Realtime as the only app backend/database.
- Google OAuth initially; do not add email/password unless a verified zero-cost email workflow is separately approved.
- Cloudflare Pages Free hosting on a `pages.dev` subdomain.
- Direct signed APK distribution; no app-store publication.
- TanStack Query for server state; Zustand only for small ephemeral UI state if useful.
- Tailwind CSS and accessible reusable components; use lucide-react icons.
- FCM is allowed only as Android push transport in Release 1.1, sent through a protected Supabase Edge Function. No Firestore or Firebase Functions.

## 4. Absolute cost constraints

The owner requires PKR 0, no billing account, no paid plan, no paid API, no paid domain, no paid map/tile service, no paid background-location SDK, no SMS authentication, no Play Store fee and no App Store fee. Never suggest connecting a card or enabling a billable service as an unnoticed implementation step. If a free quota is exhausted, show controlled service unavailability rather than upgrading or incurring charges. State honestly that vendor free tiers and policies can change; do not promise “free forever” as a vendor guarantee.

## 5. Data and product rules

- Campus presence: On Campus / Off Campus / Unknown.
- Availability: Free / In Class / Busy / Looking for Friends.
- Campus zone: a separate manual selection from the COMSATS zone catalogue.
- Automatic campus entry never sets availability or building/zone.
- Availability and zone expire at the earlier of check-in + 2 hours or 18:00 in `Asia/Karachi`.
- Campus presence has a separate freshness cutoff; stale becomes Unknown, never Off Campus.
- Ghost Mode: name/avatar remain visible; all status, location/zone, source and timestamps disappear for peers. Enforce in database/RPC/RLS, not only UI. Disabling Ghost Mode starts at Unknown and clears old data.
- Keep only the latest presence snapshot; do not store GPS trail, coordinates or user-facing history.
- Invitation is a high-entropy (recommended 128-bit) one-time expiring/revocable token, hashed at rest. A short six-digit code alone is not the security secret.
- First UI may focus on one active squad; schema supports multiple squads in one shared database and isolates data by `squad_id` with RLS.

## 6. Location rules

The uploaded COMSATS sign photo is a label/boundary reference, not georeferenced. Do not invent latitude, longitude, campus radius or polygon. Keep campus boundary config unset until a reviewed EPSG:4326 GeoJSON/KML/official GIS boundary is supplied and field-validated. Web provides manual check-in and optional one-time foreground geolocation only. No browser background geofence. Android geofence is opt-in and Release 2 only; use GeofencingClient for coarse triggers, verify against approved polygon where possible, discard transient coordinates, use entry dwell and a 3-minute exit grace/recheck, obey manual override and Ghost Mode. The 5–10 minute objective is best-effort under tested conditions, not a guarantee. Redmi/OEM power policies and Android permissions can delay or prevent updates.

## 7. Privacy and security requirements

- RLS on every exposed table, default deny.
- Use `auth.uid()`; never accept caller-controlled user IDs.
- Sensitive writes through explicit validated RPCs; do not trust client timestamps, expiry, role, source or squad membership.
- Security-definer functions must have fixed safe search_path and explicit access checks.
- Do not expose service_role, FCM private key, OAuth secret or signing keystore in frontend or Git.
- Realtime payloads and push text must not leak hidden presence.
- Owners cannot override/read a member's Ghost Mode data.
- Remove memberships/tokens on leave/account deletion as specified.
- User can use manual app if location permission denied.

## 8. Brand and UI

Working name VAGASPOT; tagline “Your people. Your campus. Your spot.” Style should be energetic, friendly, clean, campus-native, accessible and slightly playful — not childish or surveillance-themed. Use provisional color tokens from `docs/07_BRAND_AND_DESIGN_SYSTEM.md`. Screens: Sign in, Create/Join Squad, Feed, Check-in, Zone Picker, Settings, Owner Management, Offline/Error. Three main mobile tabs: Squad, Check-in, Settings. Include loading, empty, error, stale, offline and permission-denied states.

## 9. Required implementation order

Implement one phase at a time, pausing after each for review:
1. Scaffold + design tokens + routes.
2. Supabase project wiring + Google OAuth + profile.
3. Squad creation/invite/redeem/member controls.
4. Secure feed + Realtime.
5. Manual campus/availability/zone + expiry.
6. Ghost Mode + comprehensive RLS/privacy tests.
7. PWA and Cloudflare Pages deployment.
8. Capacitor Android wrapper + deep link OAuth + APK.
9. Optional FCM push.
10. Optional native Android geofencing after the explicit location gates are complete.

Do not implement Release 2 features early.

## 10. Working method

Before each phase:
- Inspect current code and `git status`.
- Read only the relevant documents.
- Give a concise plan and list files expected to change.
- Implement the narrow task.
- Run formatting, lint, typecheck, tests and production build as applicable.
- Review diff and report commands/results, manual test steps, known limitations and changed docs.
- Stop and wait for explicit instruction before next phase.

If a tool has a usage limit, stop and provide a handoff summary; do not replace working code or change stack. Another AI should be able to continue using `AGENTS.md`, the relevant spec and exact task prompt.

## 11. Deliverables

- Working source code with clear feature folders.
- Ordered SQL migrations, RPC functions and RLS policies.
- `.env.example` with placeholders only.
- Tests for business rules and authorization.
- README with exact setup/deploy commands.
- No secrets or real personal location data in sample fixtures.
- Updated docs and traceability matrix for any agreed changes.

## 12. Initial task

Do not build the entire application now. Start with **Phase 1 only: project scaffold** using `prompts/01_PROJECT_SCAFFOLD.md`. Inspect the repository, propose plan, implement, test and stop.
