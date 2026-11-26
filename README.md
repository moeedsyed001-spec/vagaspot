# VAGASPOT — Product & Engineering Pack

**Status:** Baseline v0.1 — requirements agreed; implementation gates remain open  
**Prepared:** 2026-11-23  
**Initial audience:** 6–10 invited friends at COMSATS University Islamabad  
**Platforms:** Responsive web + Android APK  
**Cost constraint:** PKR 0; no billing account, paid plan, paid API, paid domain or paid distribution channel

## What this pack is

This is the working source of truth for building VAGASPOT with AI coding tools. It deliberately separates the usable manual-first MVP from optional Android geofencing. It is designed for a small friend group, not an enterprise deployment.

The pack contains product requirements, user stories and rules, architecture, database design, screens, flows, brand rules, location and notifications specifications, test/deployment guidance, AI prompts, a starter SQL blueprint, a campus-zone CSV and the supplied campus-map photograph.

## Read in this order

1. `docs/00_DECISION_REGISTER.md` — decisions, assumptions and open gates.
2. `docs/01_PRODUCT_REQUIREMENTS.md` — what the product is and is not.
3. `docs/02_USER_STORIES_AND_BUSINESS_RULES.md` — acceptance criteria and exact rules.
4. `docs/03_SYSTEM_ARCHITECTURE.md` — chosen stack and module boundaries.
5. `docs/04_DATABASE_AND_PRESENCE_SPEC.md` — data model, RPCs, RLS and retention.
6. `docs/05_SCREENS_AND_NAVIGATION.md` and `docs/06_USER_FLOWS.md` — interface and behaviour.
7. `docs/07_BRAND_AND_DESIGN_SYSTEM.md` — visual language.
8. `docs/08_LOCATION_AND_GEOFENCING.md` and `docs/09_NOTIFICATIONS.md` — Android automation and push.
9. `docs/10_TESTING_AND_ACCEPTANCE.md` — definition of done.
10. `docs/11_ZERO_COST_DEPLOYMENT_AND_OPERATIONS.md` — accounts, hosting, APK and cost controls.
11. `docs/12_AI_BUILD_WORKFLOW.md` — tool-by-tool workflow.
12. `docs/13_TRACEABILITY_MATRIX.md` — requirement-to-test mapping.
13. `docs/14_SOURCE_REGISTER_AND_CAVEATS.md` — dated vendor references and known limits.
14. `docs/15_OPEN_ITEMS.md` — owner decisions and validation checklist.
15. `docs/16_FIRST_BUILD_SESSION.md` — exact first coding session.
16. `docs/17_BACKEND_AND_HOSTING_COMPARISON.md` — why Supabase/Cloudflare/FCM were chosen over alternatives.
17. `docs/18_THREAT_MODEL_AND_RISK_REGISTER.md` — lightweight privacy/security threat review.
18. `docs/19_PRIVACY_NOTICE_AND_CONSENT_COPY.md` — pilot disclosure and user-facing privacy language.
19. `AGENTS.md`, then `prompts/` — paste the relevant task prompt into your coding agent.

## Files to treat as authoritative

- Product decisions: `docs/00_DECISION_REGISTER.md`.
- Functional rules: `docs/02_USER_STORIES_AND_BUSINESS_RULES.md`.
- Database intent: `docs/04_DATABASE_AND_PRESENCE_SPEC.md`.
- SQL: `database/0001_schema_blueprint.sql` is a **draft blueprint**, not production-ready. Apply only after review and complete RLS/function implementation.
- Campus labels: `data/comsats-campus-zones.csv` transcribes the uploaded campus sign. Coordinates are intentionally blank.
- `references/comsats-islamabad-campus-sign-map.jpg` is a photo of the campus sign, not a georeferenced map.

## Critical implementation gates

Do not enable automatic campus detection until all are true:

1. The campus perimeter has been aligned to a real-world coordinate reference (official GIS/KML/GeoJSON, or careful map digitisation checked by field GPS observations).
2. The campus polygon is reviewed by a human who knows the premises.
3. A real target Redmi/Android device and OS version are chosen and tested.
4. Android background-location disclosure, permissions, opt-in and Ghost Mode are tested.
5. Entry/exit false-positive and latency tests pass on campus.

The MVP must remain useful if geofencing is disabled, denied, delayed, inaccurate or unavailable.

## How to use with an AI coding agent

1. Put the project root under Git.
2. Feed the agent `AGENTS.md` once as project-wide rules (and store it in the repository).
3. For each task, provide only the referenced specification sections and one prompt from `prompts/`.
4. Ask the agent to inspect current files, propose a short plan, implement only that task, run tests/type-check/build, and report changed files.
5. Inspect the diff and test locally before committing.
6. Never paste Supabase `service_role` secrets, Google client secrets, FCM service-account private keys or Android signing keys into a browser bundle, public issue or ordinary AI prompt.

## No-cost reality check

This pack targets $0 recurring infrastructure spend by using current free plans and by **not connecting a billing account**. It cannot guarantee that third-party vendors will preserve free tiers forever. Free services can change terms, pause inactive projects or stop serving when quotas are exhausted. The deliberate failure mode is temporary unavailability, not automatic paid overage. See `docs/11_ZERO_COST_DEPLOYMENT_AND_OPERATIONS.md`.

## Versioning

Treat this as v0.1. Any future change to an accepted rule should update the decision register, the relevant specification and the traceability matrix together. Do not silently let an AI agent invent conflicting behaviour.
