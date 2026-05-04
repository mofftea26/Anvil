# Changelog

Log of every change to docs / code / DB. Append new entries at the top. Use the format from [`/AGENTS.md`](../../AGENTS.md#changelog-format-docsdecisionschangelogmd).

---

## 2026-05-04 (Client dashboard — today workout + active program row)

### Changed
- **Client dashboard** — `TodayWorkoutCard` uses higher `minHeight`, larger title, and roomier CTA. `ActiveProgramProgressCard` shows program title and week label on one row; removed the separate program-week `StatChip`. New i18n: `client.dashboard.programWeekNumber`.

### Files Updated
- `features/dashboard/screens/ClientDashboardScreen.tsx`
- `shared/i18n/resources/en.json`, `fr.json`, `ar.json`
- `docs/frontend/features/client-dashboard.md`, `docs/decisions/changelog.md`

### Docs Updated
- `docs/frontend/features/client-dashboard.md`, `docs/decisions/changelog.md`

### Supabase Updated
- No.

---

## 2026-05-04 (Fix — trainer dashboard infinite re-render)

### Changed
- **`useTrainerClientsAssignmentsSummary`** — Removed the `ids` array from the fetch `useEffect` dependency list. The array was a new reference whenever `clientIds` was recreated (e.g. parent `?? []` or filter chains), so the effect re-ran every render, called `setState`, and triggered “Maximum update depth exceeded”. Dependencies are now `idsKey` (stable string), `trainerId`, `ymd`, and `refreshToken`; client ids are derived inside the effect from `idsKey`.

### Files Updated
- `features/clients/hooks/assignments/useTrainerClientsAssignmentsSummary.ts`
- `docs/decisions/changelog.md`

### Docs Updated
- `docs/decisions/changelog.md`

### Supabase Updated
- No.

---

## 2026-05-04 (Phase E — Documentation closure + i18n parity)

### Changed
- **Documentation (plan Phase E)** — Closed the overhaul doc pass: `programs.md` now explicitly documents `anvil_session_completion_sync_trigger` (session complete → assignment + `completedDayKeys`). `architecture.md` notes shared `TimelineBoard` usage and points to `features/checkins/`. Feature docs for client/trainer dashboard, workouts, clients, linking, and checkins were already aligned from Phases B–D; Supabase `tables` / `rls` / `rpc` / `triggers` entries for `clientCheckIns` and new RPCs were verified present.
- **i18n** — Fixed long-standing `fr`/`ar` drift vs `en`: `tabs.library`, `common.gotIt`, and full `library.createProgram` / `library.programsScreen` keys (plus `library.exercisesScreen` search/filter copy for `fr`). `pnpm i18n:check` is green.

### Files Updated
- `docs/frontend/features/programs.md`
- `docs/frontend/architecture.md`
- `docs/decisions/changelog.md`
- `shared/i18n/resources/fr.json`, `ar.json`

### Docs Updated
- `docs/frontend/features/programs.md`, `docs/frontend/architecture.md`, `docs/decisions/changelog.md`.

### Supabase Updated
- No.

---

## 2026-05-04 (Phase D — Trainer dashboard, clients without program, check-ins timeline)

### Changed
- **Trainer dashboard** — Replaced bottom **Clients** / **Library** quick pills with `NoProgramCard` → `/(trainer)/clients-without-program` and `CheckInsCard` → `/(trainer)/check-ins`. Stat row is now **Active** + **Check-ins today** (drops the redundant “need program” stat chip; count still on the card). Full-width **Add client** button.
- **Clients without program** — `ClientsWithoutProgramScreen`, `ClientNoProgramRow`, `useClientsWithoutActiveProgram`, `clientsWithoutProgram.api.ts` (`anvil_get_trainer_clients_without_active_program`). Quick assign reuses `ChooseProgramTemplateSheet` + `AssignToClientsSheet` with `initialClientIds`.
- **Check-ins feature** — New `features/checkins/`: `TrainerCheckInsTimelineScreen`, `CheckInModal`, `CheckInTimelineItem`, `useTrainerCheckIns`, `useTrainerTodayCheckInsCount`, `checkins.api.ts` (Phase A RPCs + selective `clientCheckIns` read for month dots). Route `app/(trainer)/check-ins.tsx`. Stack entries in `app/(trainer)/_layout.tsx`.
- **i18n** — `trainer.dashboard.*` card/chip strings; `trainer.checkIns.*`; `trainer.noProgram.*` (en/fr/ar).

### Files Updated
- `features/dashboard/screens/TrainerDashboardScreen.tsx`
- `features/checkins/*` (**new**)
- `features/clients/api/clientsWithoutProgram.api.ts` (**new**)
- `features/clients/hooks/useClientsWithoutActiveProgram.ts` (**new**)
- `features/clients/components/no-program/ClientNoProgramRow.tsx` (**new**)
- `features/clients/screens/ClientsWithoutProgramScreen.tsx` (**new**)
- `app/(trainer)/_layout.tsx`
- `app/(trainer)/clients-without-program.tsx` (**new**)
- `app/(trainer)/check-ins.tsx` (**new**)
- `shared/i18n/resources/en.json`, `fr.json`, `ar.json`
- `docs/frontend/features/checkins.md` (**new**)
- `docs/frontend/features/trainer-dashboard.md`, `clients.md`, `README.md`
- `docs/frontend/navigation.md`, `folder-structure.md`
- `docs/decisions/changelog.md`

### Docs Updated
- See file list above.

### Supabase Updated
- No (uses existing Phase A migration).

### Notes
- `pnpm i18n:check` still reports pre-existing `fr` / `ar` drift vs `en` (library + common keys, unchanged by this phase).

---

## 2026-05-04 (Phase C — Client program progress + dashboard)

### Changed
- **Program progress screen** — New `ProgramProgressScreen` (`features/workouts/screens/ProgramProgressScreen.tsx`) composes `ProgramInfoSection`, `ProgramCalendarGrid`, and `WorkoutDayModal`. Data: `useProgramProgress` → `anvil_get_active_program_detail` + `anvil_get_program_progress`; workout-day rows resolve to `clientWorkoutAssignments` via `listClientWorkoutAssignmentsForProgramAssignment` for the modal + run/details CTAs. Routes: `app/(client)/program/[assignmentId].tsx` (canonical) and `app/(client)/workouts/program-assignment/[assignmentId].tsx` (both render the same screen).
- **Client dashboard** — Removed the weekly "week done" StatChip. Active program mini-card is now a tappable `ActiveProgramProgressCard` → `/(client)/program/[assignmentId]`. Replaced coach StatChip + coach ActionPill with `LinkedCoachCard`. Schedule / Program pills deep-link to `?tab=schedule` and `?tab=program`.
- **My Program tab** — Active card and plan summary use `useActiveProgramDetail` (RPC aggregate counts). Plan summary tiles: total, workout, rest, completed, pending, missed. Removed bottom `singleActiveHint` copy. "View full program schedule" and archived rows navigate to `/(client)/program/[id]`.
- **API / hooks** — `features/workouts/api/programProgress.api.ts`; `useProgramProgress` / `useActiveProgramDetail` in `features/workouts/hooks/useProgramProgress.ts`; `ActiveProgramDetail` type on `features/workouts/types.ts`. `useAssignedWorkout` accepts optional `{ enabled?: boolean }` for modal gating.
- **i18n** — Expanded `client.programProgress.*` (info, day status, modal strings), `client.dashboard.activeProgramProgressTitle`, `client.program.totalDaysChip` / `daysLeftChip` (en/fr/ar).

### Files Updated
- `features/workouts/api/programProgress.api.ts` (**new**)
- `features/workouts/hooks/useProgramProgress.ts` (**new**)
- `features/workouts/hooks/useAssignedWorkout.ts`
- `features/workouts/types.ts`
- `features/workouts/components/program/ProgramInfoSection.tsx` (**new**)
- `features/workouts/components/program/WorkoutDayModal.tsx` (**new**)
- `features/workouts/screens/ProgramProgressScreen.tsx` (**new**)
- `features/workouts/screens/ClientMyProgramScreen.tsx`
- `features/dashboard/screens/ClientDashboardScreen.tsx`
- `app/(client)/program/[assignmentId].tsx` (**new**)
- `app/(client)/workouts/program-assignment/[assignmentId].tsx`
- `shared/i18n/resources/en.json`, `fr.json`, `ar.json`
- `docs/frontend/features/client-dashboard.md`, `workouts.md`, `programs.md`, `navigation.md`, `docs/decisions/changelog.md`

### Docs Updated
- See file list above.

### Supabase Updated
- No (uses existing Phase A RPCs).

---

## 2026-05-04 (Phase B — Dashboard / Program / Check-ins overhaul, shared frontend pieces)

### Changed
- **Frontend only** — Phase B of the Dashboard / Program / Schedule / Check-ins overhaul plan. No Supabase changes. Phases C–E (client-side, trainer-side, docs polish) will land in subsequent commits.
- **B1 — Extracted the schedule timeline into a generic shared primitive.** Moved the body of `features/workouts/components/ScheduleTimelineBoard.tsx` into `shared/ui/timeline/TimelineBoard.tsx` and re-exported it from `@/shared/ui` as `TimelineBoard` (with `TimelineBoardProps`, `TimelineDay`, `TimelineItem` types). Two new optional props let callers swap the inner card layout (`renderItemContent`) and add a muted footer hint (`bottomHintText`) without re-implementing the drag/preview logic. The existing `ScheduleTimelineBoard` import path is preserved as a thin re-export so no consumer (`ClientScheduleScreen`, `TrainerClientScheduleTab`) needs to change. `ClientScheduleScreen` was migrated to import `TimelineBoard` directly to demonstrate the new path.
- **B1 supporting move — Schedule-time utils are now shared.** The four pure helpers (`DEFAULT_SCHEDULE_TIME`, `normalizeScheduleTime`, `scheduleTimeToMinutes`, `minutesToScheduleTime`, `formatScheduleTimeLabel`) moved to `shared/utils/scheduleTime.ts`. The old `features/workouts/utils/scheduleTime.ts` becomes a re-export shim so all existing imports across `features/workouts/`, `features/clients/`, `features/assignments/`, and `features/dashboard/` keep working unchanged.
- **B2 — New reusable `ProgramCalendarGrid`.** Added `features/workouts/components/program/ProgramCalendarGrid.tsx` with memoized week rows and color-coded day cells (`completed = accent`, `pending = surface`, `missed = danger low-opacity`, `rest = muted`). Consumes a new `ProgramProgressDay` / `ProgramProgressDayStatus` type added to `features/workouts/types.ts`, matching the shape returned by the Phase A RPC `anvil_get_program_progress`. Will be plugged into `ProgramProgressScreen` in Phase C.
- **B3 — New reusable `LinkedCoachCard`.** Added `features/linking/components/client-coach/LinkedCoachCard.tsx`. Single-tap card that renders the trainer's `logoUrl` as a full-card cover image with a brand-tinted gradient overlay for legibility, a `Linked`/`Unlinked` status pill, the coach's first name (large), and a chevron CTA. Replaces the dashboard's StatChip-coach + `openCoach` ActionPill pair (Phase C) without breaking the existing `ClientCoachCard` (which still drives the full coach tab).
- **B4 — Workouts tab deep-linking.** `app/(client)/(tabs)/workouts.tsx` now reads `useLocalSearchParams<{ tab?: string }>()` and passes it through as `initialTab` to `ClientWorkoutsScreen`. The screen gained an optional `initialTab` prop (with an effect that re-syncs when the param changes) and ignores unknown values (falls back to `program`). Enables the upcoming dashboard "Schedule" pill to deep-link directly to `/(client)/(tabs)/workouts?tab=schedule`.
- **i18n** — Added two new keys mirrored across `en` / `fr` / `ar` (parity preserved for the new keys; pre-existing library-feature drift is unchanged and already tracked in tech debt):
  - `client.dashboard.linkedCoachCta` — accessibility label / fallback CTA for `LinkedCoachCard`.
  - `client.programProgress.weekLabel` — default `Week {{n}}` label for `ProgramCalendarGrid` rows.
- **Icons** — Added `dumbbell → Dumbbell01Icon` to `shared/ui/utils/iconMapping.ts` so the calendar grid (and any prior `name="dumbbell"` usage) resolves to the proper icon instead of falling back to `QuestionIcon`.

### Files Updated
- `shared/ui/timeline/TimelineBoard.tsx` (**new**)
- `shared/ui/index.ts`
- `shared/ui/utils/iconMapping.ts`
- `shared/utils/scheduleTime.ts` (**new**)
- `features/workouts/utils/scheduleTime.ts` (now a re-export shim)
- `features/workouts/components/ScheduleTimelineBoard.tsx` (now a re-export shim)
- `features/workouts/components/program/ProgramCalendarGrid.tsx` (**new**)
- `features/workouts/types.ts`
- `features/workouts/screens/ClientScheduleScreen.tsx`
- `features/workouts/screens/ClientWorkoutsScreen.tsx`
- `app/(client)/(tabs)/workouts.tsx`
- `features/linking/components/client-coach/LinkedCoachCard.tsx` (**new**)
- `shared/i18n/resources/en.json`
- `shared/i18n/resources/fr.json`
- `shared/i18n/resources/ar.json`

### Docs Updated
- `docs/frontend/theme-and-ui.md` — documented the new shared `TimelineBoard` primitive.
- `docs/frontend/features/workouts.md` — noted the timeline + scheduleTime moves and the new `?tab=` deep link.
- `docs/frontend/features/programs.md` — noted the new `ProgramCalendarGrid` and the `ProgramProgressDay` type.
- `docs/frontend/features/linking.md` — noted the new reusable `LinkedCoachCard`.
- `docs/decisions/changelog.md` — this entry.

### Supabase Updated
- No.

---

## 2026-05-04 (Phase A — Dashboard / Program / Check-ins overhaul, backend)

### Changed
- **Supabase only** — Phase A of the Dashboard / Program / Schedule / Check-ins overhaul plan. Frontend phases B–E will land in subsequent commits.
- Added `anvil_session_completion_sync_trigger` (AFTER UPDATE on `workoutSessions`): when a session transitions into `status='completed'`, automatically marks the linked `clientWorkoutAssignments` row complete and appends `programdaykey` into `clientProgramAssignments.progress.completedDayKeys` (with `lastCompletedAt`). Removes the client-side reliance on manual `mark_program_day_complete` for the standard finish path; the legacy RPC is kept for compatibility.
- Added RPC `anvil_get_program_progress(p_program_assignment_id uuid)`: walks the program template `state` deterministically (matching `generate_program_workout_assignments`), derives global `weekIndex`/`dayIndex` from `scheduled_for - startdate`, and resolves a per-day status (`rest|completed|pending|missed`) by joining `clientWorkoutAssignments` and consulting `progress.completedDayKeys`.
- Added RPC `anvil_get_active_program_detail(p_assignment_id uuid)`: single-row composite (`assignment + template + counts`). Replaces the ad-hoc joins on the My-Program tab and the dashboard active-program card.
- Added RPC `anvil_get_trainer_clients_without_active_program()`: trainer-scoped roster slice (active link + no `clientProgramAssignments.status='active'`). Powers the new `NoProgramCard` and `ClientsWithoutProgramScreen`.
- Added new table `clientCheckIns` (camelCase) with check-in schedule columns, indexes `(trainerId, scheduledFor, sortOrder)` and `(clientId, scheduledFor)`, RLS (trainer + linked client SELECT, trainer-only INSERT/UPDATE/DELETE), and `set_updated_at` trigger.
- Added 4 RPCs: `anvil_get_trainer_checkins_by_date(date)`, `anvil_upsert_client_checkin(...)`, `anvil_reorder_client_checkin(...)`, `anvil_delete_client_checkin(uuid)`. All 7 new `anvil_*` RPCs are explicitly `revoke execute … from anon` and `grant execute … to authenticated` so they don't add to the existing `anon_security_definer_function_executable` count.
- All new functions pin `set search_path = public`. The trigger function has `EXECUTE` revoked from all roles (only the trigger event invokes it).
- Verified end-to-end against the live DB by exercising each RPC and the trigger inside `BEGIN ... ROLLBACK` blocks.

### Files Updated
- `supabase/migrations/20260504144217_dashboard_checkins_overhaul.sql` (**new**)

### Docs Updated
- `docs/supabase/tables.md` — added `clientCheckIns`.
- `docs/supabase/rls-policies.md` — added `clientCheckIns` policies; updated outstanding-warnings counts.
- `docs/supabase/triggers.md` — added `anvil_session_completion_sync_trigger` and `trg_clientcheckins_updatedat`.
- `docs/supabase/rpc-functions.md` — added the 7 new RPCs (with template) and a "Check-ins" section.
- `docs/supabase/relationships.md` — added `clientCheckIns` FK rows.
- `docs/supabase/schema.md` — added `clientCheckIns` to entity reference.
- `docs/supabase/README.md` — refreshed advisor-warning posture.
- `docs/decisions/technical-debt.md` — refreshed unused-index count.

### Supabase Updated
- Yes. Live DB updated via `execute_sql` (per the runbook — `apply_migration` skipped because the migration ledger is already drifted; tracked under "Local migrations not applied to live DB"). Migration file written to `/supabase/migrations/` for git history. `get_advisors`: security 164 → 173 (+9 expected: 1 anon GraphQL, 1 authenticated GraphQL, 7 authenticated SECURITY DEFINER); performance 157 → 158 (+1 expected `unused_index` on `idx_clientcheckins_client_date`, will resolve once the client side reads check-ins). No new categories of warnings.

---

## 2026-05-04

### Changed
- Redesigned trainer and client dashboards with a premium look: branded gradient hero, primary action card (trainer's today roster / client's today workout), animated program progress bar (client), colored icon stat chips, and three-up quick action pills — all fit on one viewport without scrolling.
- Trainer dashboard surfaces a roster of today's training clients with avatars, workout titles, and clear active/rest status dots, plus a prominent "View all" link to the clients tab.
- Client dashboard turns "Today" into a strong CTA: tap to start a session (`/(client)/workouts/run/[assignmentId]`) or view a completed one; rest days get a calm dedicated panel.
- Refreshed dashboard localization keys in `en`, `fr`, and `ar` (greetings, hero summaries, today/roster strings, stat/action labels).
- Updated the workouts month/year picker so tapping reset applies the current month and year immediately without requiring an extra apply tap.
- Completely redesigned both client and trainer profile pages with a modern layout (overview hero, refreshed account card, clearer section cards, and side-by-side action row) while keeping all existing profile features and flows.
- Removed the top profile overview section from both trainer and client profile screens to keep the page focused on editable content.
- Fixed client profile birth-date field text alignment by adding left padding inside the date selector button.
- Redesigned the trainer clients page and client coach page with a more modern visual hierarchy, including upgraded cards/actions and stronger brand/logo presentation on the coach view.
- Updated coach card branding behavior: removed the foreground logo tile, kept logo as background watermark, removed the extra "My coach" label line above the headline, and used trainer name as fallback headline when brand name is missing.
- Centralized screen gutter spacing via shared `getScreenHorizontalPadding` + `KeyboardScreen` defaults, and migrated touched screens away from ad-hoc wrapper paddings.
- Refined coach page brand background visuals with layered logo watermarks and softer brand glow overlays for a cleaner premium look.
- Updated coach brand background again to use the trainer logo as full-card `cover` background (with stronger overlay for readability).
- Updated trainer clients screen to remove the top stats block and use 3 filter pills (`All`, `Active`, `Archived`) with counts and live filtering; active/archived client status pills now use distinct colors.
- Updated trainer clients ordering to always show active clients first.

### Files Updated
- `features/dashboard/screens/TrainerDashboardScreen.tsx`
- `features/dashboard/screens/ClientDashboardScreen.tsx`
- `shared/i18n/resources/en.json`
- `shared/i18n/resources/fr.json`
- `shared/i18n/resources/ar.json`
- `features/workouts/components/ScheduleTimelineBoard.tsx`
- `features/profile/components/ProfileOverviewCard.tsx` (removed)
- `features/profile/components/client-profile/ClientBasicInfoCard.tsx`
- `features/profile/components/client-profile/ClientBodyMetricsCard.tsx`
- `features/profile/components/client-profile/ClientPreferencesCard.tsx`
- `features/profile/components/trainer-profile/TrainerBrandCard.tsx`
- `features/profile/components/trainer-profile/TrainerFormCard.tsx`
- `features/profile/screens/ClientProfileScreen.tsx`
- `features/profile/screens/TrainerProfileScreen.tsx`
- `shared/ui/components/ProfileAccountCard.tsx`
- `features/clients/screens/TrainerClientsScreen.tsx`
- `features/clients/components/trainer-clients/TrainerClientCard.tsx`
- `features/linking/screens/ClientCoachScreen.tsx`
- `features/linking/components/client-coach/ClientCoachCard.tsx`
- `features/linking/components/client-coach/ClientCoachCertsCard.tsx`
- `features/linking/components/client-coach/ClientCoachNotLinked.tsx`
- `features/linking/components/client-coach/CoachAvatar.tsx`
- `shared/ui/layout/KeyboardScreen.tsx`
- `shared/ui/index.ts`
- `features/workouts/screens/ClientScheduleScreen.tsx`
- `features/workouts/screens/ClientMyProgramScreen.tsx`
- `features/library/screens/ProgramTemplatesListScreen.tsx`
- `features/builder/screens/WorkoutBuilderScreen.tsx`
- `features/builder/screens/ExercisePickerScreen.tsx`
- `features/builder/screens/ExerciseDetailScreen.tsx`
- `features/library/screens/ExercisesScreen.tsx`
- `features/library/screens/ProgramTemplateEditorScreen.tsx`

### Docs Updated
- `docs/frontend/features/trainer-dashboard.md`
- `docs/frontend/features/client-dashboard.md`
- `docs/frontend/features/README.md`
- `docs/frontend/features/workouts.md`
- `docs/frontend/features/profile.md`
- `docs/frontend/features/clients.md`
- `docs/frontend/features/linking.md`
- `docs/frontend/features/workouts.md`
- `docs/frontend/features/programs.md`
- `docs/frontend/features/builder.md`
- `docs/frontend/features/exercise-library.md`
- `docs/frontend/theme-and-ui.md`
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
