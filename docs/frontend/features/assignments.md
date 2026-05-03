# Assignments

## Status

Implemented (cross-feature helpers — sub-domain extraction, not a top-level user-facing feature).

## Purpose

`features/assignments/` exists as a thin shared layer between `clients`, `workouts`, and `library` that aggregates a client's program assignments and per-day workout assignments. It is consumed by the trainer's "Assignments" tab on a client's detail screen and by hooks elsewhere that need both program and workout assignment rows in one shot.

## User Flow

There is no dedicated screen for the assignments feature. The flow is composed inside other features:

- Trainer opens a client → `TrainerClientDetailsScreen` mounts the `TrainerAssignmentsTab`, which uses `useClientAssignments` to render the merged list.
- Client-side schedule reads (`features/workouts/hooks/*`) call into the same `assignmentsApi` to keep behavior consistent.

## Main Files

- `features/assignments/api/assignmentsApi.ts` — plain async functions (`listTrainerClientProgramAssignments`, `listTrainerClientWorkoutAssignments`, plus the helpers that gracefully tolerate the missing `scheduledtime` column documented in tech debt).
- `features/assignments/hooks/useClientAssignments.ts` — orchestrates the two queries plus a fetch of program-template metadata and a join to `workouts` for titles. Returns merged view-models.
- `features/assignments/components/TrainerAssignmentsTab.tsx` — UI rendered by `TrainerClientDetailsScreen`.

## Components

- `TrainerAssignmentsTab` — list / grouping of program assignments and workout assignments; consumed by `features/clients/`.

## Hooks

- `useClientAssignments({ trainerId, clientId })` — owns the side effects, sequencing, and progress derivation (uses `totalPlannedDayKeys` from `features/workouts/utils/programProgress`).

## State Management

- Local `useState` (no Redux slice). Suitable because the tab is short-lived; consumers re-mount on focus.
- Reads `scheduleTimeOverrides` from `@/shared/utils` to surface a per-assignment local time override (persisted in `AsyncStorage`).

## API / Supabase Dependencies

- Tables: `clientProgramAssignments`, `clientWorkoutAssignments`, `programTemplates` (read), `workouts` (read).
- No RPC calls today — assignments are SELECT-only here. Assignment creation lives in `features/library/` (program assignment) and `features/workouts/` (workout assignment) and uses RPCs (`anvil_assign_program_to_client`, `assign_client_workout_template`, `generate_program_workout_assignments`).

## Validation Rules

- None on this layer. The aggregation is read-only.

## UI / UX Rules

- Uses `@/shared/ui` primitives only.
- Empty / loading states delegated to the consumer (`TrainerClientDetailsScreen`).

## iOS + Android Notes

- No platform-specific concerns.

## SOLID / Architecture Notes

- This folder is intentionally narrow — no `screens/`, no `store/`. It encapsulates the read-side of assignment data so consumers don't reach across feature boundaries to two different feature folders.
- API module exports plain async functions (pattern 5b in `/docs/frontend/how-to-add-a-feature.md`) rather than RTK Query endpoints, because the data is consumed in a per-mount way.
- Eventual goal: migrate to RTK Query endpoints under `features/assignments/api/assignmentsApiSlice.ts` so caching is consistent with the rest of the app. See [`technical-debt.md`](../../decisions/technical-debt.md) → "Inconsistent fetching pattern in features/workouts/hooks".

## Performance Notes

- Sequencing: list two assignment tables, then batch-load program templates and workouts by id. Three round trips total per mount.
- The "missing `scheduledtime` column" guard (`isMissingScheduledTimeColumn`) is a temporary tolerance for the unapplied migration `20260503165500_workout_assignment_schedule_time.sql` — see tech debt.

## Known Issues

- Local migration `20260503165500_*` not applied to live DB; feature relies on the `isMissingScheduledTimeColumn` fallback. Tracked in [`technical-debt.md`](../../decisions/technical-debt.md).
- No RTK Query caching; concurrent consumers each issue their own queries.

## Last Updated

2026-05-03 — feature doc backfilled during the docs / rules / skills audit pass.
