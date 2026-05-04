# Technical Debt

Living list of issues we know about but haven't fixed. Use the format below. Sort by `Priority` then `Area`.

## Format

```
## Item Title
Status:        open / in-progress / resolved
Priority:      low / medium / high / critical
Area:          frontend / supabase / build / docs
Problem:
Suggested Fix:
Related Files:
Date Found:    YYYY-MM-DD
```

---

## `.env` is committed to the repo
Status:        open
Priority:      high
Area:          build / supabase
Problem:       The repo's `.env` (with `EXPO_PUBLIC_SUPABASE_URL` + publishable key) is committed because `.gitignore` only excludes `.env*.local`, not `.env`. The values are publishable so leakage is not catastrophic, but it leaks the project ref publicly and breaks dev/prod environment separation.
Suggested Fix: Rename to `.env.local` (or add `/.env` to `.gitignore`), commit a `.env.example`, document in `docs/supabase/environment.md`.
Related Files: `.env`, `.gitignore`, `docs/supabase/environment.md`.
Date Found:    2026-05-03

---

## Local migrations not applied to live DB
Status:        open
Priority:      high
Area:          supabase
Problem:       `supabase/migrations/` contains three files (`20250126000000_*`, `20260503150000_*`, `20260503165500_*`), but `list_migrations` (Supabase MCP) returns an empty list. The schema diverged via direct SQL (probably `execute_sql` / dashboard). The frontend already references `scheduledtime` from the unapplied `20260503165500_workout_assignment_schedule_time.sql`.
Suggested Fix: Decide between (A) `supabase db push` to apply all local migrations and accept the diff, or (B) `supabase migration repair --status applied <ver>` for the first two and apply the third. Then ensure CI uses migrations going forward.
Related Files: `supabase/migrations/*`, `features/workouts/api/clientWorkouts.api.ts`, `shared/utils/scheduleTimeOverrides.ts`.
Date Found:    2026-05-03

---

## RLS policies re-evaluating `auth.uid()` per row (83 warnings)
Status:        open
Priority:      high
Area:          supabase
Problem:       Performance advisor reports 83 `auth_rls_initplan` warnings. Each affected RLS policy invokes `auth.uid()` per row; planner can't hoist the call.
Suggested Fix: Wrap `auth.uid()` in `(select auth.uid())` in every affected policy. This is mechanical; do it in one migration and re-run advisors.
Related Files: All public table policies; see `docs/supabase/rls-policies.md`.
Date Found:    2026-05-03

---

## `SECURITY DEFINER` RPCs callable by `anon`
Status:        open
Priority:      high
Area:          supabase
Problem:       53 `anvil_*` / `assign_*` functions are executable by `anon`. Most should require `authenticated`.
Suggested Fix: For each function, `revoke execute on function … from anon;` unless intentionally public. Add a checklist to the function-creation skill.
Related Files: `docs/supabase/rpc-functions.md`.
Date Found:    2026-05-03

---

## RLS policies with `WITH CHECK true`
Status:        open
Priority:      medium
Area:          supabase
Problem:       `exercises_update` and `programtemplates_update` use `WITH CHECK true`. The intent is "owner-or-shared-with-edit" — that's checked in USING but not in WITH CHECK, so the post-update row could in theory drift away from access rules.
Suggested Fix: Replicate the USING expression in WITH CHECK. Re-run advisors.
Related Files: `docs/supabase/rls-policies.md`.
Date Found:    2026-05-03

---

## Public buckets allow listing
Status:        open
Priority:      medium
Area:          supabase
Problem:       `avatars` and `logos` have a SELECT policy of `bucket_id = '…'` — anyone with the URL prefix can list. Public read by path is desired; listing is not.
Suggested Fix: Tighten storage SELECT policies, or move to short-lived signed URLs for the listing surface (Profile screen / chat once it lands).
Related Files: `docs/supabase/storage.md`.
Date Found:    2026-05-03

---

## Auth leaked password protection disabled
Status:        open
Priority:      medium
Area:          supabase
Problem:       Supabase Auth's HaveIBeenPwned check is off. Compromised passwords can be reused.
Suggested Fix: Enable in Supabase Auth settings. Add a min-length (≥10) policy. Document in `docs/supabase/auth.md`.
Related Files: Supabase dashboard → Auth.
Date Found:    2026-05-03

---

## Function `search_path` mutable (15 warnings)
Status:        open
Priority:      medium
Area:          supabase
Problem:       15 SQL/PL/pgSQL functions don't pin `search_path`, exposing them to schema-resolution attacks.
Suggested Fix: Add `SET search_path = public` (or explicit list) to each.
Related Files: `prevent_role_change_if_confirmed`, `set_users_updated_at`, `setUpdatedAt`, etc. — list in `docs/supabase/rpc-functions.md`.
Date Found:    2026-05-03

---

## Multiple permissive policies / duplicate policies (41 + 6)
Status:        open
Priority:      medium
Area:          supabase
Problem:       41 `multiple_permissive_policies` warnings (e.g. `clientProfiles` has both `client_profiles_*` and `clientprofiles_*`). Each query runs all of them.
Suggested Fix: Drop the older snake-case duplicates after verifying the camelCase set covers the same surface.
Related Files: `docs/supabase/rls-policies.md`.
Date Found:    2026-05-03

---

## 33 unused indexes & 1 duplicate index
Status:        open
Priority:      low
Area:          supabase
Problem:       Performance advisor lists 33 unused indexes and 1 duplicate (`trainerClients` has `trainer_clients_trainer_id_client_id_key` and `trainerclients_trainerid_clientid_key`). Wasted writes and storage. Phase A added one new unused index (`idx_clientcheckins_client_date`); it will resolve once the client side reads check-ins.
Suggested Fix: For each unused index, confirm via `pg_stat_user_indexes` then `drop index if exists …`. Drop one of the duplicate trainerClients indexes.
Related Files: Migration file under `supabase/migrations/`.
Date Found:    2026-05-03

---

## Two parallel program/workout structure models
Status:        open
Priority:      medium
Area:          supabase
Problem:       Workouts/programs maintain both normalized child tables (`workoutSeriesBlocks`/`Exercises`/`SetPrescriptions`, `programPhases`/`PhaseDays`) and a JSONB `state`. Drift risk; double the write paths.
Suggested Fix: Confirm `state` is the source of truth, migrate any remaining writers to it, then drop the child tables. Add `pg_jsonschema` for guardrails.
Related Files: `features/library/api/programTemplates.api.ts`, `features/builder/api/workouts.api.ts`.
Date Found:    2026-05-03

---

## Duplicate `set_updated_at` triggers on `workouts`
Status:        open
Priority:      low
Area:          supabase
Problem:       `workouts` has both `trg_workouts_updated_at` and `workouts_set_updated_at` triggers calling the same function.
Suggested Fix: Drop one. Migration with `drop trigger if exists workouts_set_updated_at on public.workouts;`.
Related Files: `docs/supabase/triggers.md`.
Date Found:    2026-05-03

---

## Two `exercises.api.ts` files
Status:        open
Priority:      low
Area:          frontend
Problem:       `shared/api/exercises.api.ts` and `features/builder/api/exercises.api.ts` overlap. Risk of divergence.
Suggested Fix: Consolidate to `shared/api/exercises.api.ts` and re-export from builder if needed.
Related Files: `shared/api/exercises.api.ts`, `features/builder/api/exercises.api.ts`.
Date Found:    2026-05-03

---

## Inconsistent fetching pattern in `features/workouts/hooks`
Status:        open
Priority:      low
Area:          frontend
Problem:       Some hooks use RTK Query, others ad-hoc `useState`+`useEffect`. Caching is therefore inconsistent.
Suggested Fix: Migrate `features/workouts/hooks/*` to RTK Query slices (`workoutsApiSlice`).
Related Files: `features/workouts/hooks/*`.
Date Found:    2026-05-03

---

## `eslint-report.txt` and `ts-prune-report.txt` at repo root
Status:        resolved
Priority:      low
Area:          docs / build
Problem:       These look like one-off reports committed by mistake. They go stale immediately.
Suggested Fix: Add to `.gitignore` and delete from the repo. If they should be tracked, document where they come from.
Related Files: `eslint-report.txt`, `ts-prune-report.txt`.
Date Found:    2026-05-03
Resolved:      2026-05-03 — verified via Glob; neither file exists in the working tree today. If they reappear, add them to `.gitignore`.

---

## No automated tests
Status:        open
Priority:      medium
Area:          frontend
Problem:       No `jest`, no test files, no CI test step.
Suggested Fix: Start with pure utilities (`workoutMetrics.ts`, `units.ts`, `programSchedule.ts`). Then `renderWithProviders` for component tests. See `docs/frontend/testing.md` for plan.
Related Files: `package.json`, `docs/frontend/testing.md`.
Date Found:    2026-05-03

---

## i18n parity drift: 42 fr / 40 ar keys missing
Status:        open
Priority:      medium
Area:          frontend / docs
Problem:       `pnpm i18n:check` reports 42 keys missing in `fr.json` and 40 missing in `ar.json` versus `en.json`. Examples: `tabs.library`, `common.gotIt`, the entire `library.programsScreen.*` and `library.createProgram.*` namespaces, `library.exercisesScreen.searchPlaceholder` / `filterByMuscle`. Strings render in English on those locales until translated.
Suggested Fix: Run `pnpm i18n:check` to print the full list. Translate to fr and ar (or have a translator do it). Re-run until green. Going forward, the `40-i18n-rtk-a11y.mdc` rule + the `i18n:check` script + the `anvil-i18n-sync` skill prevent regressions.
Related Files: `shared/i18n/resources/{en,fr,ar}.json`, `scripts/i18n-check.js`, `.cursor/rules/40-i18n-rtk-a11y.mdc`, `.agents/skills/anvil-i18n-sync/SKILL.md`.
Date Found:    2026-05-03

---

## No iOS/Android keep-awake during workout-runner
Status:        open
Priority:      low
Area:          frontend
Problem:       Phones may dim/lock during a session. `expo-keep-awake` is not installed.
Suggested Fix: Add `expo-keep-awake`, call `useKeepAwake()` in `WorkoutRunScreen`.
Related Files: `features/workouts/screens/WorkoutRunScreen.tsx`.
Date Found:    2026-05-03

---

## `workoutSetLogs.serieskey`/`exercisekey` semantics under-documented
Status:        open
Priority:      low
Area:          supabase / frontend
Problem:       The unique key on `workoutSetLogs` includes `serieskey` and `exercisekey` (text), but the runner uses `seriesExerciseId` directly. If those text keys aren't set consistently the unique constraint will fire.
Suggested Fix: Document the intended convention (likely `serieskey = block.id`, `exercisekey = exercise.id`) and either enforce in the API helper or rename columns.
Related Files: `features/workouts/api/clientWorkouts.api.ts`, `docs/supabase/tables.md`.
Date Found:    2026-05-03

---

## `handle_new_auth_user` trigger wiring unverified
Status:        resolved
Priority:      medium
Area:          supabase
Problem:       The function exists in `pg_proc` but we couldn't confirm a trigger on `auth.users` calls it. If it's missing, new auth signups won't get a `public.users` row and onboarding will silently break.
Suggested Fix: `select tgname, tgrelid::regclass from pg_trigger where tgfoid = 'public.handle_new_auth_user'::regproc;` to verify; add the trigger if missing.
Related Files: `docs/supabase/auth.md`, `docs/supabase/triggers.md`.
Date Found:    2026-05-03
Resolved:      2026-05-03 — verified via MCP `execute_sql` over `pg_trigger`. Trigger `on_auth_user_created` exists on `auth.users` (AFTER INSERT), calls `public.handle_new_auth_user()`, `SECURITY DEFINER`. `docs/supabase/rpc-functions.md` updated.
