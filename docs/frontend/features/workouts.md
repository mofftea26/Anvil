# Workouts (Client side)

## Status

Implemented (read flows + assignments). The runner is documented separately in [`workout-runner.md`](./workout-runner.md).

## Purpose

Lets a client see, browse, and start their assigned workouts. Combines a personal schedule (timeline of upcoming and past assignments), program-level schedule when an active program is assigned, and an "Assigned workout details" view that opens before starting a session.

## User Flow

1. Client taps **Workouts** tab → `ClientWorkoutsScreen`. Top tabs (`WorkoutsTopTabs`):
   - **Schedule** — timeline of `clientWorkoutAssignments` for the next ~14 days (`useClientWorkoutSchedule`).
   - **My program** — current `clientProgramAssignments` row + scheduled days (`useClientProgramAssignments`).
   - **History** — past completed sessions (`WorkoutHistoryScreen`).
   - **Stats** — `workoutStatsDaily` aggregates (`ClientStatsScreen`).
2. Tapping a scheduled card → `/(client)/workouts/assigned/[assignmentId]` → `AssignedWorkoutDetailsScreen` (read-only template view + Start CTA).
3. Tapping **Start** → `/(client)/workouts/run/[assignmentId]` → see [`workout-runner.md`](./workout-runner.md).
4. Program assignments → `ClientProgramScheduleScreen` shows weeks/days; tapping a day opens `ClientProgramDayDetailScreen`.

## Main Files

- API
  - `features/workouts/api/clientWorkouts.api.ts` — async functions wrapping RPCs and reads.
- Hooks
  - `features/workouts/hooks/useAssignedWorkout.ts`
  - `features/workouts/hooks/useClientWorkoutSchedule.ts`
  - `features/workouts/hooks/useClientProgramAssignments.ts`
  - `features/workouts/hooks/useProgramTemplatesPublicMap.ts`
  - `features/workouts/hooks/useWorkoutSessionDetails.ts`
  - `features/workouts/hooks/useWorkoutTemplatesMap.ts`
- Screens (client)
  - `features/workouts/screens/ClientWorkoutsScreen.tsx`
  - `features/workouts/screens/ClientScheduleScreen.tsx`
  - `features/workouts/screens/ClientMyProgramScreen.tsx`
  - `features/workouts/screens/ClientProgramScheduleScreen.tsx`
  - `features/workouts/screens/ClientProgramDayDetailScreen.tsx`
  - `features/workouts/screens/AssignedWorkoutDetailsScreen.tsx`
  - `features/workouts/screens/ClientStatsScreen.tsx`
  - `features/workouts/screens/WorkoutHistoryScreen.tsx`
  - `features/workouts/screens/WorkoutSessionDetailsScreen.tsx`
- Components
  - `features/workouts/components/ScheduleTimelineBoard.tsx`
  - `features/workouts/components/WorkoutsTopTabs.tsx`
  - `features/workouts/components/WorkoutTemplateReadOnly.tsx`
  - `features/workouts/components/charts/MiniBarChart.tsx`
  - `features/workouts/components/run/*` — covered in [`workout-runner.md`](./workout-runner.md)
- Utils
  - `features/workouts/utils/dateUtils.ts`
  - `features/workouts/utils/programProgress.ts`
  - `features/workouts/utils/programSchedule.ts`
  - `features/workouts/utils/scheduleTime.ts`
  - `features/workouts/utils/workoutMetrics.ts`
- Types
  - `features/workouts/types.ts`
- Routes
  - `app/(client)/(tabs)/workouts.tsx`
  - `app/(client)/workouts/_layout.tsx`
  - `app/(client)/workouts/assigned/[assignmentId].tsx`
  - `app/(client)/workouts/program-assignment/[assignmentId].tsx`
  - `app/(client)/workouts/program-assignment/[assignmentId]/day/[dayKey].tsx`
  - `app/(client)/workouts/run/[assignmentId].tsx`
  - `app/(client)/workouts/sessions/[sessionId].tsx`

## Components

- `WorkoutsTopTabs` — segmented control across `schedule | program | history | stats`.
- `ScheduleTimelineBoard` — vertical day list with cards per assignment.
- `WorkoutTemplateReadOnly` — non-editable rendering of a workout's series/exercises/sets (used in details + history).
- `MiniBarChart` — small bar chart for stats (volume per day, etc.).
- `WorkoutRunExerciseCard`, `WorkoutRunSetRow` — runner-only.

## Hooks

- `useClientWorkoutSchedule({ from, to })` — calls `get_my_workout_schedule(p_from, p_to)`. Returns assignments + helpers to apply local schedule-time overrides (see `shared/utils/scheduleTimeOverrides.ts`).
- `useClientProgramAssignments()` — reads `get_my_program_assignments()`.
- `useAssignedWorkout(assignmentId)` — fetches a single assignment + its template (joins workouts → blocks → exercises).
- `useWorkoutTemplatesMap(ids)` — batch fetch of workouts by id (avoid N+1).
- `useProgramTemplatesPublicMap(ids)` — same, for program templates.
- `useWorkoutSessionDetails(sessionId)` — for the post-finish summary screen.

## State Management

- All reads via plain `*.api.ts` async functions called from hooks (some hooks use `useEffect` + state, others wrap RTK Query — see each hook). Prefer RTK Query for new code.
- The runner has its own state (see [`workout-runner.md`](./workout-runner.md)).

## API / Supabase Dependencies

### Tables
- `clientWorkoutAssignments` (RLS: client OR linked trainer; mutations restricted to trainer or self).
- `clientProgramAssignments`.
- `workouts` (`SELECT` via assigned-client policy if not owner).
- `workoutSeriesBlocks`, `workoutSeriesExercises`, `workoutSetPrescriptions` (joined via `workouts`).
- `workoutSessions` and `workoutSetLogs` (covered in runner doc).
- `workoutStatsDaily` (per-client aggregates).

### RPCs
- `get_my_workout_schedule(p_from, p_to)` — returns `clientWorkoutAssignments` for the calling client.
- `get_my_program_assignments()` — same, for programs.
- `mark_program_day_complete(p_program_assignment_id, p_day_key)` / `unmark_program_day_complete(...)`.
- `update_workout_assignment_date(p_assignment_id, p_scheduled_for)`.
- `archive_client_workout_assignment` / `reactivate_client_workout_assignment`.

## Validation Rules

- `assignmentId`/`sessionId` route params must be UUIDs (route guard).
- The schedule-time override is local-only (`AsyncStorage`) — never sent to the server.

## UI / UX Rules

- Schedule cards use brand accent for "today" rows.
- Use `ScheduleTimelineBoard` for vertical scrollable lists.
- In the month/year bottom sheet, tapping reset applies the current month/year immediately and closes the sheet.
- Pull-to-refresh on each tab.
- Empty states: friendly copy + "Find a trainer" CTA if unlinked.
- Don't show absolute timestamps to seconds — use `formatShortDate` and `formatDurationSeconds`.

## iOS + Android Notes

- Date inputs / sheets must respect both iOS modal pickers and Android wheel pickers.
- The runner uses Reanimated worklets — avoid heavy synchronous work on the JS thread when scrolling cards.

## SOLID / Architecture Notes

- API helpers live in `clientWorkouts.api.ts`; **screens never call `supabase` directly**.
- `WorkoutTemplateReadOnly` is the single source of truth for rendering a workout structure (used in details, history, runner preview).
- `programSchedule.ts` is pure — given `state` and a date, returns the day key. Easy to unit-test (when tests land).

## Performance Notes

- Pass tight date ranges (`p_from`, `p_to`) to `get_my_workout_schedule` so the indexed read on `(clientid, scheduledfor)` is used.
- `useWorkoutTemplatesMap` batches via `.in("id", ids)`.
- Avoid re-rendering the entire timeline on selection — `React.memo` cards by id.

## Known Issues

- Some hooks use ad-hoc `useState`/`useEffect` for fetching instead of RTK Query — inconsistent caching. Migrate to RTK Query incrementally.
- The local migration `20260503165500_workout_assignment_schedule_time.sql` adds a `scheduledtime` column, but it is **not yet applied to the live database**. Front-end code that conditionally reads `scheduledtime` works because the column simply doesn't exist; clean up after the migration is applied. Tracked in tech debt.
- The schedule timeline doesn't yet handle the new `scheduledtime` server-side; frontend overrides via `scheduleTimeOverrides` are local-only.
- `unused_index` advisor reports several never-used indexes on `clientWorkoutAssignments`/`workoutSessions` — review before adding more.

## Last Updated

2026-05-04 — month/year picker reset now applies immediately from the bottom sheet.
