# 09 — Notifications Specification

## 1. Release plan

- MVP: Realtime in-app feed; no push dependency.
- Release 1.1: Android FCM push via a Supabase Edge Function after end-to-end credential and dedupe testing.
- Web browser push: defer. In-app Realtime is enough for the small initial group.

## 2. Default preferences

| Event | Default | Notification copy |
|---|---:|---|
| Friend enters campus | ON | “A friend is now on campus.” |
| Friend leaves campus | OFF | “A friend has left campus.” |
| Friend becomes Free | ON | “A friend is free to meet.” |
| Friend selects Looking for Friends | ON | “A friend is looking for company.” |
| New squad member joins | ON | “A new friend joined your squad.” |
| Zone changes | OFF | “A friend updated their campus spot.” (Do not include zone name) |
| Ghost Mode changes | OFF | No notification |

A master push switch overrides every category. Users can change preferences whenever they want. OS-level permission still applies; if notifications are denied by Android, show a settings hint but do not block the app.

## 3. Android push architecture

- Firebase project is used only for FCM transport, not Firestore/Auth.
- Android obtains FCM registration token; token is sent to an authenticated Supabase RPC and associated with `auth.uid()`.
- On a presence transition, app calls a protected Supabase Edge Function with a non-secret event reference or state-change request.
- Function validates the caller JWT, membership, recipient preferences, event freshness and Ghost Mode using Supabase server credentials.
- Function sends FCM message using a server-side service account credential stored as an Edge Function secret.
- Dedupe by a random event identifier and recipient. Ignore stale duplicate events.
- Remove invalid/unregistered tokens when FCM returns the appropriate error.
- Do not place Supabase service-role key or FCM private key in React/Capacitor client.

Do not depend on an unverified database webhook/`pg_net` pipeline for the first push release. A client-triggered Edge Function after a committed RPC is simpler to reason about for this project; feed updates remain correct even if push is missed. If reliable server-triggered push becomes essential, evaluate an outbox + webhook with current Supabase support and test it under Free plan before adoption.

## 4. Push payload privacy

- Notification text is generic.
- Do not include GPS coordinates, zone names, notes, hidden statuses or raw invite tokens.
- Do not notify about a user's presence while Ghost Mode is enabled.
- If sender changes to Ghost Mode between event creation and send, recheck before dispatch and suppress.
- Don't expose group member list via notification payload.

## 5. Failure handling

- FCM token absent: no push; feed still updates.
- OS permission denied: no push; app still works.
- Edge Function quota/network unavailable: push skipped; feed still works.
- Invalid token: delete token registration.
- Duplicate event: dedupe and do not send twice.
- User disabled preference: suppress event.

## 6. Web notifications

In initial web experience, use visible in-app notification indicators and live feed. Browser push requires service-worker registration, Web Push credentials/VAPID and per-browser permission. It is not required for MVP and should not be implemented until Android push is stable and the team has tested browser support.
