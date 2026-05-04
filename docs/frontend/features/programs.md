# Programs

## Status

Implemented. Builder UI is functional; per-day workout planning and program assignment are wired end-to-end.

## Purpose

Lets a trainer build multi-week, multi-phase **program templates** (a structured plan that maps weekdays to workouts), publish them, and assign them to clients. Programs generate per-day `clientWorkoutAssignments` automatically when assigned.

## User Flow

1. From `/(trainer)/(tabs)/library` → **Programs** card → `/(trainer)/library/programs` → list of template cards.
2. Trainer taps **+ New program** → `/(trainer)/library/create-program` → wizard (`CreateProgramTemplateScreen`):
   - Title, description, difficulty, duration phases (with weeks per phase).
3. On save → `anvil_create_program_template(...)` → returns the new template; navigation pushes to `/(trainer)/library/program-templates/[programId]` (the editor).
4. In the editor (`ProgramTemplateEditorScreen`):
   - Shows phases with week pills, and each weekday under the active week.
   - Trainer taps a day → opens `DayPlannerSheet` to attach a published workout from their library, or marks the day as `rest`.
   - Trainer can rename phases, change duration, drag-reorder days, archive/unarchive the template, or change its status (`draft`/`published`/`archived`).
   - All edits are sent through the `programTemplates.api.ts` helpers, which call RPCs.
5. From the `Library → Programs` screen or from a client's detail screen, the trainer can **assign** the template:
   - `anvil_assign_program_to_client(p_client_id, p_program_template_id, p_start_date, p_notes)` creates a `clientProgramAssignments` row.
   - `generate_program_workout_assignments(p_program_assignment_id, p_replace_existing)` then materializes per-day `clientWorkoutAssignments`.

## Main Files

- API
  - `features/library/api/programTemplates.api.ts`
- Hooks
  - `features/library/components/programs/programsPage/hooks/usePrograms.ts`
  - `features/library/components/programs/programsPage/hooks/useProgramTemplate*.ts`
  - `features/library/components/programs/programsPage/programTemplateEditor/hooks/useProgramTemplateEditor*.ts`
  - `features/library/components/programs/programsPage/components/dayPlanner/hooks/useResolvedWorkoutRows.ts`, `useSheetPanGesture.ts`, `useSwipeHintAnimation.ts`, `useDayPlannerPalette.ts`
  - `features/library/components/programs/createProgram/hooks/useCreateProgram.ts`
  - `features/library/components/programs/createProgram/createProgramTemplate/hooks/useCreateProgramTemplateForm.ts`
- Screens
  - `features/library/screens/ProgramsScreen.tsx`
  - `features/library/screens/ProgramTemplatesListScreen.tsx`
  - `features/library/screens/CreateProgramScreen.tsx`
  - `features/library/screens/CreateProgramTemplateScreen.tsx`
  - `features/library/screens/ProgramTemplateEditorScreen.tsx`
- Components
  - `features/library/components/programs/programsPage/components/ProgramTemplateCard.tsx`
  - `features/library/components/programs/programsPage/components/programTemplateCard/components/*` (header, info modal, menu modal, stats row)
  - `features/library/components/programs/programsPage/components/dayPlanner/*` (sheet, header, empty state, swipe hint, workout list)
  - `features/library/components/programs/programsPage/programTemplateEditor/components/*` (week pill, difficulty row, etc.)
  - `features/library/components/programs/createProgram/createProgramTemplate/components/*` (title/description/duration/difficulty fields, footer)
- Types/utils
  - `features/library/types/programTemplate.ts`
  - `features/library/utils/programColors.ts`, `formatShortDate.ts`, `programDayAttachmentBridge.ts`
- Routes
  - `app/(trainer)/library/programs.tsx`
  - `app/(trainer)/library/create-program.tsx`
  - `app/(trainer)/library/program-templates/[programId].tsx`

## Components

- `ProgramTemplateCard` — list cell with difficulty pill, duration, status, menu (publish/archive/clone/delete), info modal.
- `DayPlannerSheet` — bottom sheet to attach a workout to one phase day, with palette swatches.
- `ProgramTemplateEditor*` — the live editor (week pills, day rows, drag-reorder).
- `CreateProgramTemplate*` — wizard form fields.
- `ProgramCalendarGrid` (`features/workouts/components/program/ProgramCalendarGrid.tsx`) — client-side reusable week × day grid showing each program day's status. Consumes `ProgramProgressDay[]` from `anvil_get_program_progress` (`status: completed | pending | missed | rest`). Used by `ProgramProgressScreen` (`/(client)/program/[assignmentId]`).

## Hooks

- `useCreateProgram()` / `useCreateProgramTemplateForm()` — wizard submission.
- `usePrograms()` — list query for the trainer's templates.
- `useProgramTemplateEditorData(templateId)` — fetches and shapes the JSONB `state` for the editor.
- `useProgramTemplateEditorActions()` — bulk actions (publish, archive, set status, delete).
- `useProgramTemplateEditorDrag()` — drag-reorder for days.
- `useResolvedWorkoutRows()` — joins phase day refs with the workouts table.

## State Management

- All persistence through `programTemplates.api.ts` (uses RPCs + direct `programTemplates` reads).
- The template's structure is stored on `programTemplates.state` (JSONB) — the editor mutates it locally and then calls `anvil_update_program_template_state(p_template_id, p_state)`.
- `templateShares` is read by RLS for shared templates.

## API / Supabase Dependencies

### Tables
- `programTemplates` — root row; columns include `ownerTrainerId`, `status`, `title`, `description`, `difficulty`, `durationWeeks`, `state` (JSONB), `isArchived`, `isStock`, audit fields.
- `programPhases` — phase rows (legacy normalized model); newer code stores phases inside `state`.
- `programPhaseDays` — phase-day rows (legacy normalized model).
- `clientProgramAssignments` — created by `anvil_assign_program_to_client`. Carries `progress JSONB`.
- `clientWorkoutAssignments` — generated per phase day by `generate_program_workout_assignments`.

### RPCs
- `anvil_create_program_template(p_title, p_description, p_difficulty, p_duration_weeks, p_state)` (`SECURITY DEFINER`).
- `anvil_update_program_template_meta(p_template_id, p_title, p_description, p_difficulty, p_duration_weeks)`.
- `anvil_update_program_template_state(p_template_id, p_state)`.
- `anvil_set_program_template_status(p_template_id, p_status)`.
- `anvil_set_program_template_archived(p_template_id, p_is_archived)`.
- `anvil_clone_program_template(p_source_template_id, p_new_title)`.
- `anvil_get_program_template(p_template_id)`.
- `anvil_can_view_program_template(p_template_id)` / `anvil_can_edit_program_template(p_template_id)`.
- `anvil_assign_program_to_client(p_client_id, p_program_template_id, p_start_date, p_notes)`.
- `generate_program_workout_assignments(p_program_assignment_id, p_replace_existing)`.
- `anvil_extract_planned_workouts_from_state(p_state)`.
- `mark_program_day_complete(p_program_assignment_id, p_day_key)` / `unmark_program_day_complete(...)`.
- `update_program_assignment_start_date(p_assignment_id, p_start_date)`.
- `archive_client_program_assignment` / `reactivate_client_program_assignment` / `unassign_program_from_client` / `reset_client_program_assignment_progress`.
- `get_my_program_assignments()` / `get_trainer_client_program_assignments(p_client_id)`.
- `anvil_get_program_progress(p_program_assignment_id)` — per-day status table for a client program assignment (template walk + assignment/session truth); used by `ProgramProgressScreen` / `ProgramCalendarGrid` (see [`workouts.md`](./workouts.md)).
- `anvil_get_active_program_detail(p_assignment_id)` — single round-trip: assignment + template + aggregate day counts (`totalDays`, workout/rest/completed/pending/missed, expected end); used by My Program and program info header.

### Triggers
- `anvil_program_children_bump_trigger` on `programPhases`/`programPhaseDays` (bumps audit ts on parent template).
- `anvil_set_template_audit_fields` on `programTemplates` insert/update.
- `anvil_lock_creator_owner_fields` on `programTemplates` update (prevents changing creator/owner).
- `anvil_touch_program_template_timestamps` on update.
- `anvil_session_completion_sync_trigger` on `workoutSessions` (`AFTER UPDATE`): when a session becomes `status='completed'`, marks the linked `clientWorkoutAssignments` row completed and appends `programdaykey` to `clientProgramAssignments.progress.completedDayKeys` (plus `lastCompletedAt`). Keeps program progress in sync when the client finishes early without a separate `mark_program_day_complete` call. See `/docs/supabase/triggers.md`.

## Validation Rules

- Title: required, 1–120 chars (UI; **Needs verification** for DB check constraint).
- Description: optional, ~500 chars max (UI only).
- Difficulty: enum `anvil_program_difficulty` (`beginner`/`intermediate`/`advanced`).
- Duration weeks: positive integer; sum across phases ≤ `durationWeeks` field.
- `state` JSONB shape: `{ stateVersion: 1, phases: [...] }` — see `buildInitialProgramState` and `normalizeState` in `programTemplates.api.ts`.

## UI / UX Rules

- Use `programColors.ts` to assign consistent colors per phase/day.
- Day planner sheet uses `react-native-gesture-handler` pan gestures with a swipe-hint animation.
- Drag-reorder uses Reanimated worklets; release with haptic feedback.
- Confirmations for destructive actions (`Delete`, `Unassign`) via `useAppAlert`.
- Program templates list screen uses the shared app-wide horizontal gutter helper (`getScreenHorizontalPadding`) for consistent edge spacing.

## iOS + Android Notes

- Drag-reorder must work with both touch and assistive technologies. Test on both platforms.
- Bottom sheets must respect the bottom safe area (Android edge-to-edge).
- Long template lists should virtualize (`FlatList`) — currently `ScrollView`, OK at small N.

## SOLID / Architecture Notes

- The JSONB `state` is the canonical structure; the legacy normalized phase tables are still updated in some flows but new code prefers `state`. Refactor toward a single source of truth (tracked in tech debt).
- Editor hooks are split per concern (data, actions, drag).

## Performance Notes

- `useProgramTemplatesMap` batches lookups for many program ids.
- Avoid re-rendering all day rows when one row changes — use `React.memo(DayRow)` and stable keys.
- Reanimated worklets keep drag at 60 fps.

## Known Issues

- Two parallel models (JSONB `state` vs `programPhases`/`programPhaseDays`). Decide on one and migrate. Tracked in tech debt.
- `programtemplates_update` RLS policy has `WITH CHECK true` (an `rls_policy_always_true` warning) — effectively allows update if the SELECT path matches. Tighten or document the intent.
- No schema validation (e.g., `pg_jsonschema`) on `programTemplates.state` — drift risk.
- Indexes on `programTemplates(ownerTrainerId, …)` — there are duplicates (`idx_programtemplates_owner` vs `idx_programTemplates_ownerTrainerId`). Drop one.

## Last Updated

2026-05-04 — Phase E: documented `anvil_session_completion_sync_trigger` (session finish → assignment + program day progress).
2026-05-04 — Phase C: `ProgramCalendarGrid` is wired into `ProgramProgressScreen` (client); see `docs/frontend/features/workouts.md`.
2026-05-04 — Phase B: added the reusable `ProgramCalendarGrid` (week × day status grid) and the `ProgramProgressDay` type that wraps the `anvil_get_program_progress` RPC return rows.
