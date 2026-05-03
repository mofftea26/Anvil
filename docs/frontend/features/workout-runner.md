# Workout Runner

## Status

Partially implemented. The runner can start/resume sessions, log sets with autosave, finish the session, and show a "saved" status. Some UX polish (rest timer, set-type-specific UI, in-screen exercise navigation, video instructions) is incomplete.

## Purpose

The "live workout" experience for clients: opens an assignment, ensures a `workoutSessions` row exists (creating or resuming), and lets the client log reps/weight/completion per set. Autosaves every ~700ms after edits. On finish, marks the session complete and computes duration.

## User Flow

1. From `AssignedWorkoutDetailsScreen` → tap **Start** → navigates to `/(client)/workouts/run/[assignmentId]`.
2. `WorkoutRunScreen` mounts → `useAssignedWorkout(assignmentId)` loads the assignment + template.
3. `useWorkoutRun(...)` runs `getOrCreateInProgressSession({ clientId, trainerId, workoutAssignmentId, workoutTemplateId })`:
   - If a session exists with `status='in_progress'` → resume; otherwise create new.
   - Hydrates existing `workoutSetLogs` into the local `draftsByKey` map.
4. Sticky timer counts seconds since `startedAt`.
5. The body lists series → exercises → sets. For each set:
   - reps + weight inputs, completed toggle.
   - Edits flag the key dirty; debounced flush (700ms) calls `upsertWorkoutSetLogs`.
6. **Save now** button forces a flush.
7. **Finish** opens a confirmation, calls `flush()` then `finishWorkoutSession({ sessionId, durationSec })`. Navigates to `/(client)/workouts/sessions/[sessionId]?celebrate=1`.

## Main Files

- `features/workouts/screens/WorkoutRunScreen.tsx`
- `features/workouts/hooks/useWorkoutRun.ts`
- `features/workouts/hooks/useAssignedWorkout.ts`
- `features/workouts/components/run/WorkoutRunExerciseCard.tsx`
- `features/workouts/components/run/WorkoutRunSetRow.tsx`
- `features/workouts/api/clientWorkouts.api.ts`
  - `getOrCreateInProgressSession`
  - `listWorkoutSetLogs`
  - `upsertWorkoutSetLogs`
  - `finishWorkoutSession`
- Route: `app/(client)/workouts/run/[assignmentId].tsx`

## Components

- `WorkoutRunExerciseCard` — one card per exercise. Header (title + sets summary) + list of `WorkoutRunSetRow`.
- `WorkoutRunSetRow` — reps input, weight input, completed checkbox.

## Hooks

- `useWorkoutRun({ clientId, assignment, template })` — the orchestrator:
  - State: `session`, `isStarting`, `draftsByKey`, `saving`, `saveError`, `elapsedSec`.
  - Actions: `updateReps(key, next)`, `updateWeight(key, next)`, `toggleCompleted(key)`, `flush()`, `finish()`.
  - Implementation details:
    - `dirtyKeysRef` collects pending writes.
    - `scheduleFlush` debounces saves at 700ms.
    - Timer tick updates `nowMs` once per second.
- `useAssignedWorkout(assignmentId)` — loads the assignment + template (joins workouts → blocks → exercises).

## State Management

- All state is local to the screen — no Redux involvement. The runner is **the** stateful screen of the app.
- `appToast` for user-facing success/error.
- `useAppAlert` for the finish confirmation.

## API / Supabase Dependencies

### Tables
- `workoutSessions` (insert/select/update via the participant policies).
- `workoutSetLogs` (insert/update/delete via the session-participant policy).

### RPCs
- `anvil_start_workout_session(p_assignment_id)` — creates the session if none in_progress and returns it.
- `anvil_finish_workout_session(p_session_id, p_duration_sec)` — sets `finishedat`, `durationsec`, `status='completed'`.

### Async API helpers
- `getOrCreateInProgressSession` — wraps the start RPC plus a fallback select.
- `listWorkoutSetLogs(sessionId)` — direct read.
- `upsertWorkoutSetLogs(drafts[])` — direct upsert keyed by `(sessionid, serieskey, exercisekey, setindex)`.
- `finishWorkoutSession({ sessionId, durationSec })` — wraps the finish RPC.

## Validation Rules

- Reps: integer ≥ 0 (UI uses numeric keypad; empty string is allowed and stored as `null`).
- Weight: number ≥ 0 (decimal allowed; same null handling).
- Completed: boolean toggle.
- The runner refuses to start if `assignment.workoutTemplateId` is missing.

## UI / UX Rules

- Sticky header shows live timer (`mm:ss`).
- "All changes saved" / "Saving…" / "Couldn't save" status banner above the list.
- Use `expo-haptics` (`selectionAsync`) on toggling a set complete (planned).
- Don't navigate away during a finish flow — block back navigation while `finishing=true`.
- The post-finish summary screen accepts `?celebrate=1` to play a one-time confetti animation (Reanimated).

## iOS + Android Notes

- Numeric inputs use `keyboardType='decimal-pad'` for weight and `'number-pad'` for reps.
- iOS keyboard-avoidance handled by `KeyboardScreen` wrapper (where applicable).
- Android: do not rely on `keepAwake` unless `expo-keep-awake` is added (not currently installed).
- Test that the timer keeps ticking when the app is backgrounded briefly — currently it relies on `setInterval` on the JS side, so it pauses while backgrounded. **Needs verification** of the desired behavior; consider deriving `elapsedSec` from `startedAt` only.

## SOLID / Architecture Notes

- `useWorkoutRun` is the only place that mutates `workoutSetLogs`/`workoutSessions`. Screens depend on it via DIP.
- Set rows are pure presentation — no API calls.
- Timer is a derived value (`now - startedAt`) — single source of truth.

## Performance Notes

- Drafts are stored as a flat `Record<key, …>` for O(1) updates.
- Debounced flush avoids hammering the DB while typing.
- `upsertWorkoutSetLogs` writes whole-row upserts; for very large workouts (50+ sets) consider chunking.
- Reanimated worklets for the celebrate animation.

## Known Issues

- Rest timer / set-type-specific UI (drop sets, supersets, etc.) is not yet implemented.
- Switching between exercises is sequential scroll; no quick navigation.
- Timer pauses during background — consider deriving from `startedAt` instead of `setInterval`.
- No "discard / cancel session" path; you can only finish or background out.
- `workoutSetLogs` upsert key relies on `seriesExerciseId` matching the `exercises.id` — if a workout is edited mid-session, identifiers may shift. Edge case worth documenting.

## Last Updated

2026-05-03 — initial documentation generated.
