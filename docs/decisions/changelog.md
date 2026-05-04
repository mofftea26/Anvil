# Changelog

Log of every change to docs / code / DB. Append new entries at the top. Use the format from [`/AGENTS.md`](../../AGENTS.md#changelog-format-docsdecisionschangelogmd).

---

## 2026-05-04

### Changed
- Updated the workouts month/year picker so tapping reset applies the current month and year immediately without requiring an extra apply tap.

### Files Updated
- `features/workouts/components/ScheduleTimelineBoard.tsx`

### Docs Updated
- `docs/frontend/features/workouts.md`
- `docs/decisions/changelog.md`

### Supabase Updated
- No.

---

## 2026-05-03 (later)

### Changed
- Audit-and-improvement pass on docs / rules / skills / workflow. No code or DB changes.
- Verified `handle_new_auth_user` trigger wiring via MCP (`on_auth_user_created` on `auth.users` AFTER INSERT) and resolved the corresponding tech-debt item.
- Re-ran `get_advisors` (security: 164, performance: 160) — no new findings vs the bootstrap snapshot.
- Surfaced i18n drift: 42 fr / 40 ar keys missing vs en. Logged as new tech-debt item.

### Files Updated
- `AGENTS.md` — added feature-doc template, runbook links, "same change" doc-update wording.
- `.cursor/rules/00-documentation-discipline.mdc` — tightened with explicit same-change wording + runbook links.
- `.cursor/rules/10-react-native-architecture.mdc` — rewrote with concrete patterns (thin route, hook-owns-side-effects, React Compiler caveat); dropped FlashList and `src/**` glob.
- `.cursor/rules/20-supabase-mcp.mdc` — codified `apply_migration` discipline, JWT validation pattern, UPDATE-needs-SELECT RLS gotcha, `(select auth.uid())` wrap.
- `.cursor/rules/30-feature-docs.mdc` — made the doc-update list a hard requirement; corrected globs.
- `.cursor/rules/40-i18n-rtk-a11y.mdc` — **new** rule covering i18n discipline, RTK Query conventions, accessibility minimums.
- `.github/pull_request_template.md` — **new** PR template encoding the doc / Supabase / frontend checklists.
- `scripts/docs-lint.js` — **new** Node script enforcing feature-doc structure + Last Updated dates + README mapping coverage.
- `scripts/i18n-check.js` — **new** Node script enforcing en/fr/ar key parity and flagging empty translations.
- `package.json` — added `docs:lint` and `i18n:check` scripts.
- `supabase/ARCHITECTURE_NOTES.md` — content folded into `/docs/supabase/schema.md` and `/docs/supabase/rpc-functions.md`; replaced with a pointer.

### Docs Updated
- `docs/frontend/how-to-add-a-feature.md` — **new** canonical runbook (route shell → hook → API → i18n → doc → PR).
- `docs/supabase/how-to-change-the-schema.md` — **new** canonical runbook (inspect → execute_sql → migration → advisors → docs).
- `docs/frontend/features/builder.md` — **new** feature doc backfilled for `features/builder/`.
- `docs/frontend/features/assignments.md` — **new** feature doc backfilled for `features/assignments/`.
- `docs/frontend/features/README.md` — replaced status table with explicit doc → folder mapping for the 13 docs and 10 code folders.
- `docs/supabase/schema.md` — added "Canonical contracts", "RLS spine", "Storage spine" sections (folded from `ARCHITECTURE_NOTES.md`).
- `docs/supabase/rpc-functions.md` — added "Client-facing RPC catalog" quick reference; resolved `handle_new_auth_user` Needs verification.
- `docs/decisions/technical-debt.md` — marked `eslint-report.txt` / `ts-prune-report.txt` and `handle_new_auth_user` items resolved; logged new "i18n parity drift" item.

### Skills Added
- `.agents/skills/anvil-feature-scaffolder/SKILL.md`
- `.agents/skills/anvil-supabase-change/SKILL.md`
- `.agents/skills/anvil-edge-function/SKILL.md`
- `.agents/skills/anvil-doc-lint/SKILL.md`
- `.agents/skills/anvil-i18n-sync/SKILL.md`

### Supabase Updated
- No DB or function changes. Read-only inspection via the Supabase MCP (`ekvwvxmpuwscqvfzlpek`). Trigger wiring for `handle_new_auth_user` confirmed; advisor counts unchanged.

---

## 2026-05-03

### Changed
- Bootstrapped the full living documentation system. No code or DB changes.
- Inspected the entire repository (frontend + Supabase via MCP).
- Captured outstanding security/performance advisor warnings as technical debt.

### Files Updated
- `AGENTS.md` (created during this session, refined now)
- `docs/README.md`

### Docs Updated
- `docs/frontend/README.md`
- `docs/frontend/architecture.md`
- `docs/frontend/tech-stack.md`
- `docs/frontend/folder-structure.md`
- `docs/frontend/navigation.md`
- `docs/frontend/state-management.md`
- `docs/frontend/api-layer.md`
- `docs/frontend/theme-and-ui.md`
- `docs/frontend/animations.md`
- `docs/frontend/performance.md`
- `docs/frontend/testing.md`
- `docs/frontend/platform-notes-ios-android.md`
- `docs/frontend/features/README.md`
- `docs/frontend/features/auth.md`
- `docs/frontend/features/onboarding.md`
- `docs/frontend/features/trainer-dashboard.md`
- `docs/frontend/features/client-dashboard.md`
- `docs/frontend/features/clients.md`
- `docs/frontend/features/linking.md`
- `docs/frontend/features/programs.md`
- `docs/frontend/features/workouts.md`
- `docs/frontend/features/workout-runner.md`
- `docs/frontend/features/exercise-library.md`
- `docs/frontend/features/profile.md`
- `docs/frontend/features/settings.md`
- `docs/frontend/features/notifications.md`
- `docs/supabase/README.md`
- `docs/supabase/environment.md`
- `docs/supabase/auth.md`
- `docs/supabase/schema.md`
- `docs/supabase/tables.md`
- `docs/supabase/relationships.md`
- `docs/supabase/rls-policies.md`
- `docs/supabase/rpc-functions.md`
- `docs/supabase/triggers.md`
- `docs/supabase/edge-functions.md`
- `docs/supabase/storage.md`
- `docs/supabase/mcp-usage.md`
- `docs/decisions/architecture-decisions.md` (8 ADRs)
- `docs/decisions/technical-debt.md` (19 items triaged)
- `docs/decisions/changelog.md` (this file)

### Supabase Updated
- No. Read-only inspection via the Supabase MCP server (project ref `ekvwvxmpuwscqvfzlpek`). All warnings captured in `technical-debt.md`.
