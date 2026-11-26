# 08 — Location and Geofencing Specification

**Release 1:** manual state and zone.  
**Release 2:** optional Android geofencing.  
**Principle:** campus awareness, not continuous tracking.

## 1. Location concepts

- **Campus presence:** On Campus / Off Campus / Unknown.
- **Availability:** Free / In Class / Busy / Looking for Friends.
- **Zone:** manually selected named area from the campus catalogue.

Never conflate them. Geofence entry updates campus presence only; it does not select availability or a building zone.

## 2. What the supplied map establishes

The uploaded COMSATS campus sign lists 34 locations and shows a blue perimeter around the illustrated property. It is useful as a label catalogue and visual boundary reference. It is a photographed, perspective-distorted sign and is not a georeferenced map. Do not infer GPS coordinates, exact shape or radius from its image pixels.

### Required georeferencing process

Preferred order:
1. Ask COMSATS facilities/administration for official GIS, KML, KMZ, GeoJSON or CAD/site-plan coordinates.
2. If unavailable, use QGIS to align a suitable aerial/satellite basemap to recognizable road/building control points, digitise the outer campus property boundary as a WGS84 polygon (EPSG:4326), and export GeoJSON.
3. Walk the publicly accessible campus perimeter with a phone GPS or, ideally, multiple phones; record several control observations at gates/corners and compare them with the polygon. Do not collect friends' routine GPS paths.
4. Have a campus-aware person review the polygon, including entrances, parking/edge facilities and whether roads/adjacent properties are included.
5. Store a versioned polygon in restricted `campus_config`; record who approved it and date.

QGIS is a free/open-source desktop GIS. The source map photograph stays in project references; it is not a spatial source by itself.

## 3. Campus definition

Product rule from owner: “On Campus” means the user's physical position is inside the COMSATS property perimeter represented by the approved polygon. Do not substitute a guessed circular radius of 300–500 m.

Potential ambiguity to resolve during georeferencing: whether the blue sign perimeter includes access roads, gate approach areas, bus/parking areas and any boundary strips not normally regarded as campus. Ask COMSATS or validate with group members; do not silently decide.

## 4. Release 1 manual behaviour

- User chooses On Campus, Off Campus or Unknown.
- Manual On/Off state is source=manual and receives server timestamp.
- Availability and zone are separate and follow their own expiry.
- Web and Android work without geolocation permission.
- Optional one-time geolocation can be added only as a convenience check; user should retain manual fallback.

## 5. Release 2 Android architecture

- Use Android native GeofencingClient through a small Kotlin Capacitor plugin.
- Register a limited set of circular geofences as coarse wake-up triggers.
- Use a geofence transition `BroadcastReceiver` to handle ENTER/EXIT/DWELL.
- Where practical, use a one-time fresh device location to verify candidate transition against the approved campus polygon.
- Use WorkManager only for retrying an already captured event / scheduling a short recheck, not as a continuous location polling loop.
- Re-register geofences after reboot/app update/permission changes as needed; verify current OS behaviour and package docs.
- Persist only automation enabled state, pending event metadata and server sync retry state locally. Do not persist coordinate trails.

Android Geofencing API uses circles; multiple fences (maximum 100 per app per device user) can be registered. Official Android guidance recommends a radius around at least 100 m for best results, and dwell can help reduce false triggers. Device/OEM power policies affect responsiveness. See source register.

## 6. Geofence geometry strategy

The campus is an irregular footprint. A single large circle would include nearby roads/areas outside the property. Use the approved polygon as the source of truth and design a coarse set of circular wake-up zones along the footprint/perimeter; do not assume circle events exactly match polygon crossing.

At a transition:
1. Read `GeofencingEvent` and check error code.
2. Obtain current/triggering location where available and record reported horizontal accuracy only in transient memory.
3. Run point-in-polygon against the approved boundary locally or through a secure validation path. Since a mobile client can be modified, this check is an accuracy/UX aid, not strong anti-spoof proof.
4. If location is unavailable or accuracy is too poor, do not claim a confident transition.
5. Discard coordinates immediately; send only `on_campus` / `off_campus`, source and server-validated event metadata to Supabase.
6. Server must verify user membership and automation opt-in; never trust client `user_id` or arbitrary source.

A determined user can spoof device location. This product is for friend coordination, not attendance, access control or enforcement. Do not use it for safety-critical proof of presence.

## 7. Entry behaviour (initial test values)

- Candidate ENTER event must be followed by a dwell or short confirmation check.
- Initial target dwell: 2 minutes; tune through field testing.
- If user is still inside approved polygon and accuracy is acceptable, set campus_state=on_campus.
- If the event is outside the polygon or uncertain, do not set On Campus.
- Do not change availability or zone.

## 8. Exit behaviour (initial test values)

- Candidate EXIT event is not proof of leaving property.
- Obtain fresh one-time location if available.
- If inside polygon, ignore exit candidate.
- If outside, start 3-minute grace and request a second one-time location.
- If still outside and accuracy acceptable, set Off Campus.
- New candidate ENTER during grace cancels pending exit.
- If network is down, queue state and retry; friends still see last server-confirmed status with freshness label.
- If confirmation fails or becomes too stale, use Unknown, not Off Campus.

**Timing statement:** 5–10 minutes is a target for ordinary tested conditions, not a guarantee. Android may delay background geofence callbacks; force-stop, denied permission, location disabled, aggressive Xiaomi/Redmi battery management and no internet may extend the delay or prevent update.

## 9. Manual override and Ghost Mode

- Manual campus selection overrides automation for up to 2 hours or until the next verified geofence transition, whichever occurs first.
- Ghost Mode immediately suppresses all shared state regardless of geofence callbacks. Native callback must check current Ghost Mode/automation state before writing.
- When Ghost Mode turns off, set state Unknown and require fresh confirmation; do not reveal pre-Ghost values.
- Turning auto detection off removes registered geofences and stops future automatic writes.

## 10. Android permissions and user disclosure

- Request only permissions needed for selected feature.
- Explain why background location is needed before the OS dialog.
- Ask for foreground location first; request background permission only when user explicitly enables automatic campus detection and the app's Android version/policy requires it.
- Respect denied/permanently denied; manual features remain usable.
- Provide a visible toggle and link/instructions to OS settings.
- Do not start monitoring until opt-in and required permission state are both confirmed.
- Review current Google Play background-location policy if ever distributing through Play; direct APK sharing still must follow Android permission/privacy expectations and applicable law.

## 11. Device testing matrix

Test at least:
- App foreground, background, process killed normally, phone rebooted.
- Battery saver on/off and vendor auto-start restrictions.
- Precise location enabled/disabled; approximate only.
- Wi-Fi/mobile data on/off.
- Enter/exit at each campus gate; walk through boundary and nearby road without entering.
- Stop near boundary for several minutes; drive past without entering.
- Ghost Mode on during crossing; turn auto detection off during pending exit.
- Low accuracy / no fix / location services off.
- Android version and Redmi model actually used by pilot.

Measure false entry, false exit, missed events and median/p95 latency. Do not enable automatic detection for all friends until pilot observations are acceptable.

## 12. No continuous tracking rule

Never add a periodic GPS service merely to achieve faster updates. If geofencing cannot meet acceptable reliability within OS constraints, keep manual check-in and consider an explicit one-time check button, not silent continuous location polling.
