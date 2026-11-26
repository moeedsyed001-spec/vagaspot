# 12 — AI Build Workflow and Tool Selection

## 1. Recommended low-cost toolchain

| Stage | Tool | Purpose | Free usage notes |
|---|---|---|---|
| Requirements/spec | ChatGPT or another general AI | Clarify rules, review docs and traceability | Use the supplied docs as source of truth; verify changed vendor facts |
| Diagramming | Mermaid + diagrams.net | System, data and user-flow diagrams | Mermaid is text; diagrams.net is free |
| UI design | Code-first Tailwind + accessible components; optional Penpot/Figma free tier | Build screens from design spec | Do not block development on a paid design account |
| Editor | VS Code | Edit, terminal, Git | Free |
| Coding agent | Google Antigravity Individual | Main repo-aware coding agent | Current individual plan is $0 with basic weekly rate limits; pause or switch to fallback when quota ends |
| Fallback AI | Any free chat/coding AI | Continue one bounded task when primary AI limit is reached | Provide AGENTS.md + relevant docs + exact task; do not assume same model/tools |
| Backend | Supabase Dashboard + SQL Editor; Supabase CLI optional | Configure Auth, tables, policies, migrations and Realtime | Free project limit and pause caveat apply |
| Native Android | Android Studio + Kotlin | Capacitor Android wrapper and geofence plugin | Local development/build is free |
| GIS boundary | QGIS | Georeference map and export polygon | Free/open-source; requires a suitable map/control points |
| Hosting | Cloudflare Pages | Deploy static web build | Use free `pages.dev`; no paid domain |
| APK | Gradle/Android Studio | Signed APK creation | Manual distribution, protect keystore |
| Version control | Git + GitHub | History, issues, backup | Keep private repo; never commit secrets |

Do not follow old Gemini Code Assist tutorials that assume the former free offering; check current status. Antigravity free limits may change and are not unlimited.

## 2. End-to-end sequence

### Step 0 — Freeze source of truth
- Put `docs/`, `AGENTS.md`, `database/`, `data/` and `prompts/` inside repository.
- Create initial Git commit.
- Do not start coding before reading Decisions, PRD, Rules, Architecture and DB spec.

### Step 1 — Campus map asset and zones
- Use the included photo as a reference, not GPS geometry.
- Confirm the 34 zone labels with friends and select quick-list rows.
- Keep coordinate fields blank.
- For Release 2 only, use QGIS and official/field reference data to create reviewed GeoJSON.

### Step 2 — Create Supabase project
- Create one Free project; no card/billing account.
- Configure Google OAuth.
- Apply migrations after AI review.
- Prove RLS with two test users before connecting full UI.

### Step 3 — Scaffold frontend
- React + Vite + strict TypeScript.
- Add only required dependencies.
- Add environment validation, routes, theme, lint, tests and `.env.example`.
- Build a static shell before data features.

### Step 4 — Implement feature order
1. Auth + session restoration.
2. Create/join squad and invites.
3. Feed query and Realtime.
4. Manual campus state, availability, zone and expiry.
5. Ghost Mode and RLS tests.
6. Owner settings/leave/remove.
7. PWA polish and Cloudflare deployment.
8. Android Capacitor wrapper and OAuth deep link.
9. Optional FCM push.
10. Optional Android geofencing after campus polygon and device tests.

### Step 5 — Quality gate each task
For every task ask AI to:
1. Read `AGENTS.md` and named spec.
2. Inspect existing code before changes.
3. State a short plan.
4. Implement only task scope.
5. Run formatter/lint/typecheck/unit tests/build.
6. Report diff, commands/results, manual verification and remaining risk.
7. Stop. Do not move to next feature without instruction.

### Step 6 — Git discipline
- Commit after each working feature with meaningful message.
- Never ask an AI to rewrite entire repository unless starting from empty scaffold.
- Review `git diff` and `git status` after each task.
- Do not merge code that contains mock secrets, insecure “allow all” RLS or fake success states.

## 3. Token-saving context strategy

Use a short context packet rather than pasting the entire documentation pack every time:

- Always: `AGENTS.md`.
- First time per feature: relevant section of its specification.
- Task prompt: exactly one file from `prompts/`.
- When debugging: exact error, relevant source file(s), test output and last successful Git commit.
- Avoid re-pasting the full PRD/architecture when a task only concerns CSS or one function.

## 4. Primary AI prompt cadence

In Antigravity (or another repository-aware agent):
1. Open repository root.
2. Add/confirm `AGENTS.md` is visible.
3. Paste one `prompts/NN_*.md` task.
4. Ask it to plan before edit; approve narrow plan.
5. Let it change files only within task scope.
6. Run tests in terminal; review results and diff.
7. Fix failures within same task, not by starting a new feature.
8. Commit when verified.

## 5. Generic fallback prompt

When primary tool is unavailable/quota-limited, paste this into another coding AI together with `AGENTS.md`, the relevant spec and the task prompt:

> You are a senior engineer continuing an existing VAGASPOT repository. Treat the attached AGENTS.md and named specification as authoritative. First inspect the existing repository and do not regenerate it. Implement only the task described below, preserving current architecture and naming. Do not add paid services or new dependencies without explaining and obtaining approval. Do not weaken RLS or put secrets in client code. Before editing, return a short plan and files expected to change. Then implement, run available tests/typecheck/build, inspect the diff and report exact commands/results. If blocked by missing credentials, device or unverified coordinates, add a safe interface/config placeholder and document the blocker instead of inventing data. Do not implement future features or silently alter business rules.
>
> TASK: [paste one task prompt]

## 6. Tool-specific prompts

Each `prompts/` file includes a task-specific goal, required input documents, implementation boundaries, checks and a fallback-ready output contract. The Master Prompt is for a new AI session or handoff; it does not replace the smaller sequential prompts for efficient implementation.
