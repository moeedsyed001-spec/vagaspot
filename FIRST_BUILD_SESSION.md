# 16 — First Build Session: exact setup sequence

This is the practical session checklist after the documentation is accepted.

## A. Create the source repository

1. Install VS Code, Git and Node.js LTS from their official websites.
2. Create a private GitHub repository called `vagaspot`.
3. Copy the entire documentation pack into the repository root, preserving folders.
4. Open the repository folder in VS Code/Antigravity.
5. Open terminal and run:

```bash
git status
git add .
git commit -m "docs: add VAGASPOT product and engineering baseline"
```

6. Confirm `AGENTS.md` is in repository root.

## B. Use the coding agent

1. Open Antigravity Individual (or another free coding agent) with repository as workspace.
2. Ask it to read `AGENTS.md`, `docs/00_DECISION_REGISTER.md`, `docs/01_PRODUCT_REQUIREMENTS.md`, `docs/03_SYSTEM_ARCHITECTURE.md` and `prompts/01_PROJECT_SCAFFOLD.md`.
3. Paste the full contents of Prompt 01. Ask for a short plan before changes.
4. Review the plan; approve only a scaffold, not auth/squads/geofencing.
5. After changes, run its reported commands in the terminal and inspect `git diff`.
6. Commit only after build/typecheck/test pass.

## C. Set up Supabase (after scaffold exists)

1. Create one Supabase Free project; do not add payment method.
2. In Authentication → Providers, enable Google.
3. Configure Google OAuth credentials and exact redirect URLs.
4. Copy project URL and anon/publishable key into `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

5. Do not put `service_role` in `.env.local` with a `VITE_` prefix or any frontend file.
6. Use Prompt 02 to review/create migrations and prove RLS using two accounts.

## D. Continue one prompt at a time

Run Prompts 03 → 04 → 05 → 06. Do not start notifications or geofencing yet. The P0 MVP is not complete until privacy tests pass.

Then use Prompt 09 for Cloudflare Pages, Prompt 10 for Capacitor APK and local release QA. Prompt 07 is optional later Android push. Prompt 08 is geofencing Release 2 and requires the campus polygon and device matrix.

## E. When a coding AI reaches its free limit

Open another free AI or wait for quota reset. Provide:
1. `AGENTS.md`.
2. Relevant specification file(s).
3. Exact task prompt from `prompts/`.
4. Current Git status, relevant files and last test results.

Use the generic fallback prompt in `docs/12_AI_BUILD_WORKFLOW.md`. Ask it to inspect and continue the existing repo rather than regenerate the project.
