# Prompt 09 — PWA and Cloudflare Pages deployment

**Feed:** `AGENTS.md`, `docs/01_PRODUCT_REQUIREMENTS.md` (platform), `docs/03_SYSTEM_ARCHITECTURE.md`, `docs/05_SCREENS_AND_NAVIGATION.md`, `docs/11_ZERO_COST_DEPLOYMENT_AND_OPERATIONS.md`.

## Task prompt

Prepare VAGASPOT as a responsive static SPA/PWA and deploy it to Cloudflare Pages Free using the provided `pages.dev` address. Add manifest, appropriate app icons, theme color, offline app-shell fallback only where it does not display stale/private presence as current, and correct SPA route handling. Web supports manual check-in and explicit one-time Geolocation only; do not implement or claim background entry/exit detection in a closed browser.

Use `npm run build` and `dist` output. Add only public Supabase URL and anon key as frontend configuration. Validate OAuth redirect, deep-link/join links, page refresh on nested routes and HTTPS. No custom domain, paid Workers, paid storage or map service. Provide exact Cloudflare dashboard setup and test checklist. Do not expose secrets.

## Checks

- Production build succeeds.
- Cloudflare Pages deploy works on a fresh browser.
- Login, invite, feed and check-in work using deployed URL.
- Direct refresh on nested route works.
- `.env.local` is not in repository or built output.
- Offline state never claims stale presence is current.
