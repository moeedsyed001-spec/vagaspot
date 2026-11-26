# AGENTS.md — standing instructions for every coding AI

You are implementing VAGASPOT, a small private campus-presence app for 6–10 friends. Read the relevant specification files before editing. This is not an enterprise app.

## Non-negotiable architecture

- One React + TypeScript + Vite web codebase, wrapped for Android using Capacitor.
- Supabase is the only application database/auth/backend source of truth. Do not add Firebase Firestore or a second database.
- Firebase Cloud Messaging is allowed only as an Android push-delivery transport in the later notification phase; Supabase remains authoritative.
- Responsive web works without native APIs. Android-specific behaviour must sit behind a typed Capacitor plugin interface and degrade safely on web.
- Initial MVP is manual-first. Native background geofencing is Release 2 and must not block the manual MVP.
- No paid service, billing-enabled plan, paid API, paid domain, paid geolocation plugin or Play Store/App Store distribution.
- Never invent campus coordinates. The supplied map photo is not georeferenced. Keep coordinates unconfigured until verified.

## Product rules

- Keep campus presence, availability and campus zone as separate fields.
- Campus presence: `on_campus`, `off_campus`, `unknown`.
- Availability: `free`, `in_class`, `busy`, `looking_for_friends`.
- Do not set availability to Free merely because a geofence detects entry.
- Manual availability/zone expire at the earlier of check-in + 2 hours or 18:00 Asia/Karachi.
- Campus presence has separate freshness logic; stale/uncertain becomes Unknown, never falsely Off Campus.
- Ghost Mode retains the member's name/avatar in the squad but hides all presence, zone, availability, source and timestamps from other members. Clear shareable fields server-side; do not merely hide them in UI.
- No GPS movement trail or historic location timeline. Store only latest state and necessary operational timestamps.
- Android geofencing is optional, opt-in and best-effort. Web does not claim background entry/exit detection.
- Entry/exit target is approximately 5–10 minutes under tested conditions, not an SLA. Permission, force-stop, battery restrictions, GPS or internet failure may delay/miss events.

## Security rules

- RLS must be enabled on every exposed table.
- Default deny. A user can only access rows for squads they belong to.
- Never trust a client-supplied `user_id`; use `auth.uid()` inside database functions.
- Use security-definer functions only where necessary, with a fixed safe `search_path`, explicit authorization checks and validated arguments.
- Never expose `service_role`, FCM service-account credentials, OAuth client secret or signing keystore to client code.
- Do not allow clients to directly update sensitive presence columns if RPCs are the approved write path.
- Invitation tokens must be cryptographically random, high entropy, hashed at rest, expiring, revocable and single-use.
- Never expose hidden presence through another RPC, Realtime payload, logs, notification text or cache.
- Sanitize user-visible notes; validate lengths and enum values on server and client.

## Engineering approach

- Make the smallest change that satisfies the task. No speculative features or broad refactors.
- Keep components small and feature-oriented. Avoid unnecessary packages and abstractions.
- Use strict TypeScript; do not use `any` to bypass types.
- Keep secrets in environment variables; commit `.env.example` only with placeholders.
- Provide loading, empty, error, offline and permission-denied states.
- Add unit/integration tests for business rules and RLS-sensitive operations.
- Never mark a task complete without running relevant tests, typecheck and production build, or clearly stating why a check could not run.
- Do not invent test output, vendor limits or API behaviour. Verify against current official docs when uncertain.
- Update traceability/docs when a product rule or API contract changes.

## Definition of done for every task

1. Read relevant spec and existing code.
2. State the narrow implementation plan.
3. Implement only the assigned task.
4. Run formatter, lint, typecheck, tests and build as applicable.
5. Report files changed, commands/results, known limitations and manual test steps.
6. Do not proceed to another feature unless asked.
