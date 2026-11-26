# Prompt 03 — Private squads and invitations

**Feed:** `AGENTS.md`, `docs/02_USER_STORIES_AND_BUSINESS_RULES.md` (US-002–004, BR-08/09), `docs/04_DATABASE_AND_PRESENCE_SPEC.md` (squads/invites/RPC), `docs/05_SCREENS_AND_NAVIGATION.md` (S-02–S-04), `docs/06_USER_FLOWS.md` (invite flow).

## Task prompt

Implement private squad creation, listing, owner/member roles and secure invitation link redemption. Use the database RPC contracts. Invitation secret must have >=128 bits of cryptographic randomness, be stored only as a SHA-256 hash, single-use, revocable and expire after the default 72 hours. Return raw token only once to the owner. Do not use sequential IDs or a weak six-digit code as a secret. Support the case where friend opens link before Google authentication; preserve token safely through OAuth and remove it from URL/history after redemption.

Implement create squad, copy/share invite link, redeem invite, invalid/expired/used/revoked states, member list, leave squad, owner remove member and revoke invite. Enforce owner actions on server, not only by hiding buttons. User can belong to more than one squad in schema, but initial UI may show one active squad.

Do not add chat, public directory, multiple active-squad switcher or notifications here.

## Checks

- Two test users create/join the same squad.
- Third unrelated user cannot read it.
- Attempt invite replay, expiry, revocation and concurrent double redemption.
- Member cannot remove owner/promote self.
- Removed user loses access immediately.
- Typecheck, tests and build.
