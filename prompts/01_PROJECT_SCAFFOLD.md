# Prompt 01 — Scaffold the VAGASPOT repository

**Use in:** Google Antigravity (primary) or any repository-aware coding AI.  
**Feed:** `AGENTS.md`, `docs/00_DECISION_REGISTER.md`, `docs/01_PRODUCT_REQUIREMENTS.md`, `docs/03_SYSTEM_ARCHITECTURE.md`, `docs/07_BRAND_AND_DESIGN_SYSTEM.md`.

## Task prompt

You are working in an empty or partially scaffolded repository. Read all supplied files first. Set up the VAGASPOT frontend only: React + Vite + TypeScript strict mode, React Router, Tailwind CSS, lucide-react, TanStack Query and Supabase JS client. Add Capacitor core/android packages only if compatible with current stable version and do not implement Android native behaviour yet.

Create the repository structure in `docs/03_SYSTEM_ARCHITECTURE.md`, app bootstrap/providers/routes, an accessible app shell with Squad / Check-in / Settings navigation, VAGASPOT provisional theme, light/dark tokens, environment validation, `.env.example`, `.gitignore`, lint/format/typecheck scripts and a basic test setup. Build placeholder screens with loading/empty states but no fake backend data pretending to be real. Add PWA manifest/app icons placeholders only if appropriate; do not claim installability until tested.

Do not implement auth, database schema, geofencing, push or business logic in this task. Keep package count small. Use current stable compatible package versions; do not copy stale version pins from tutorials.

## Checks

- `npm install`
- `npm run lint` (if created)
- `npm run typecheck`
- `npm test` (if created)
- `npm run build`

Report exact versions, file structure, commands/results and how to run locally. Do not commit secrets.
