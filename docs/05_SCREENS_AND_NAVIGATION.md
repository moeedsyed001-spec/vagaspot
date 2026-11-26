# 05 — Screens and Navigation Specification

## 1. Navigation model

Mobile bottom navigation (3 tabs):

1. **Squad** — friend feed and current user's presence summary.
2. **Check-in** — fast campus state, availability and zone editor.
3. **Settings** — privacy, automation, notifications, account and squad controls.

Desktop web uses a compact sidebar or top navigation; main content remains centered and readable. Do not build separate desktop-only features in MVP.

## 2. Screen inventory

### S-01 Welcome / Sign in
- Brand mark and short explanation.
- Primary “Continue with Google” action.
- Privacy statement: location is not continuously tracked in MVP; manual sharing is user-controlled.
- Loading, OAuth cancelled and error states.

### S-02 Create or Join Squad
- Two clear paths: Create a squad / Join with invite link.
- If user opens an invitation link before sign-in, preserve token safely through OAuth and redeem after authentication.
- No public squad search.

### S-03 Create Squad
- Squad name, 2–40 characters.
- Create button, cancel/back.
- Success screen reveals invitation link/token once and QR/share action. Raw token must not be stored in logs or analytics.

### S-04 Join Squad
- Invitation is usually opened via link; optional manual token entry for pasted token.
- Clear invalid/expired/revoked/already-used messages.
- Confirm squad name before joining where possible.

### S-05 Squad Feed (home)
Each member card displays:
- Avatar or initials and display name.
- Campus presence: On Campus / Off Campus / Unknown, with source indicator.
- Availability if active: Free / In Class / Busy / Looking for Friends.
- Campus zone and optional note if active.
- Last updated / last campus detection age.
- Ghost Mode card: name/avatar remains, neutral “Presence hidden” only; no previous timestamp/status/zone.

Top area:
- Squad name, member count, sync indicator.
- Current user's own presence summary and quick “Update” action.
- Filter optional: All / On Campus / Free (P1 only if it remains simple).

### S-06 Check-in Editor
- Campus presence: On Campus / Off Campus / Unknown.
- Availability: Free / In Class / Busy / Looking for Friends.
- Zone: searchable predefined list with quick options first.
- Optional note <=60 characters.
- Clear expiry hint (“Availability and zone clear by 6:00 PM or in 2 hours”).
- Save/update action; disable while saving.
- Show “Not synced” on error; do not pretend update is live.

### S-07 Zone Picker
- Quick zones first (academic, library, cafeteria, sitting/social, grounds/parking).
- “More campus locations” accordion for service/restricted locations.
- No map needed.
- Zone label does not imply automatic verification.

### S-08 Settings
Sections:
- Account and sign out.
- Active squad and leave squad.
- Privacy: Ghost Mode toggle.
- Notifications: master toggle and category switches (push phase).
- Location: Android automatic detection opt-in/pause, permission explanation and status (Release 2); web explains manual-only support.
- Delete account / privacy information.

### S-09 Owner Management
- Member list and remove member action.
- Generate/revoke invitation link.
- Transfer ownership or delete squad only with confirmation.
- No access to hidden member presence.

### S-10 Offline / Error states
- No connection: show last successful sync timestamp and retry.
- Backend paused/unavailable: service unavailable explanation, not a misleading empty feed.
- Realtime disconnected: poll/refetch fallback.

## 3. Key interaction details

- Check-in should take no more than 3 meaningful taps after the screen is opened. A combined quick form can remember the last zone, but must not silently reapply an expired status.
- User should be able to set Ghost Mode from the main screen as well as Settings; use a quick-access privacy control.
- Ghost Mode activation should show immediate local UI state, then confirm server persistence; on failure revert and explain that sharing state could not be changed.
- Do not display exact GPS coordinates.
- Relative time (“8 min ago”) should have accessible full timestamp on tap/focus.
- Color must not be the only indicator; include status text/icon.

## 4. Responsive rules

- Mobile base width 320 CSS px; no horizontal scroll.
- Tablet/desktop max content width ~1000 px.
- Touch targets ideally 44x44 CSS px or larger.
- Feed cards stack on mobile; desktop can use two columns only if scanability improves.
- Respect reduced-motion setting.
- Light and dark themes; ensure contrast.

## 5. Screen completion checklist

Every screen has loading, empty, error and success states; keyboard/screen-reader labels; no secret in URL after it has been redeemed; and back navigation that does not lose unsaved data without warning.
