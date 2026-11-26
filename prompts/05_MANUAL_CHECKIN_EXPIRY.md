# Prompt 05 — Manual campus/status/zone check-in and expiry

**Feed:** `AGENTS.md`, `docs/02_USER_STORIES_AND_BUSINESS_RULES.md` (BR-01–04, BR-06, BR-11–13), `docs/04_DATABASE_AND_PRESENCE_SPEC.md` (RPCs/expiry), `docs/05_SCREENS_AND_NAVIGATION.md` (S-06/S-07), `data/comsats-campus-zones.csv`.

## Task prompt

Implement the manual Check-in experience for both web and Android shell. Campus presence, availability and zone are separate controls. Campus state values: On Campus, Off Campus, Unknown. Availability: Free, In Class, Busy, Looking for Friends. Zone selector reads active rows from campus_zones and shows quick-list entries first; remaining map labels are under More locations. Optional note max 60 characters.

Use separate secure RPCs for campus state, availability and zone. Never let client choose user ID, source, authoritative timestamps or expiry. Server must compute availability/zone expiry as min(now + 2 hours, 18:00 Asia/Karachi). At or after 18:00, do not create a new active availability state. Campus presence uses separate `campus_fresh_until` and becomes Unknown when stale. Do not delete rows to achieve visible expiry. On failed mutation show “Not synced”; never claim success early.

Keep web and Android behaviour identical for manual check-ins. No geolocation permission required. Do not implement geofencing or notifications.

## Checks

- Test 10:00 → 12:00; 17:30 → 18:00; 18:15 new status rejected/empty; timezone independent of phone timezone.
- Verify changing campus state doesn't change availability/zone.
- Invalid zone and >60 character note rejected.
- Offline mutation displays retry and no fake live status.
- Typecheck, tests, build.
