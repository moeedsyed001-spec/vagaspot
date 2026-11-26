# Prompt 08 — Native Android geofencing (Release 2 only)

**Do not run until campus polygon is validated and a real Redmi device is selected.**

**Feed:** `AGENTS.md`, `docs/00_DECISION_REGISTER.md` (G-01/G-02), `docs/02_USER_STORIES_AND_BUSINESS_RULES.md` (BR-04/06/07/12), `docs/03_SYSTEM_ARCHITECTURE.md`, `docs/04_DATABASE_AND_PRESENCE_SPEC.md`, `docs/08_LOCATION_AND_GEOFENCING.md`.

## Required inputs

- Approved `campus-boundary.geojson` in EPSG:4326 (not the photo).
- Documented boundary version and approval.
- Target Redmi model and Android version.
- Agreed geofence circle definitions and field test cases.

## Task prompt

Implement a small custom Kotlin Capacitor plugin around Android GeofencingClient. Use geofence transitions as coarse triggers, not continuous GPS polling. Register approved circles (within Android limits) and handle transitions through BroadcastReceiver. Where available, take a one-time current location to verify against the approved polygon, discard raw coordinates immediately, and send only an authorized campus-state transition to Supabase.

Use explicit opt-in and user-facing disclosure. Handle foreground/background permission sequence by Android version. Manual check-in remains fully functional if permissions are denied. Implement entry dwell, 3-minute candidate-exit grace and recheck, manual override, Ghost Mode precedence, offline event queue/retry, re-registration/lifecycle and settings toggle. Do not mark Off Campus on ambiguous or low-accuracy readings. Stale becomes Unknown. Do not include availability or zone inference.

Do not use a paid commercial location SDK or periodic GPS polling. Verify all native plugin/package/OS behaviour against current Android and Capacitor documentation.

## Checks

Run field tests at all campus gates, nearby public road, stationary at boundary, indoor/outdoor, Wi-Fi/mobile network, battery saver, app background/normal process death, reboot, permission denial, Ghost Mode and auto-detection disabled. Record false positives, false negatives and p50/p95 latency. Do not call the feature done without a measured result and owner acceptance.
