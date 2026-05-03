# Supabase Contract Baseline

## Canonical Data Contracts

- `clientProgramAssignments`
  - Primary contract fields: `trainerid`, `clientid`, `programtemplateid`, `startdate`, `status`, `progress`.
  - `progress` is JSON with versioned shape: `{ version, completedDayKeys, lastCompletedAt }`.
- `clientWorkoutAssignments`
  - Canonical workout pointer is `workoutid` (references `workouts.id`).
  - Program-generated rows set `source='program'` and carry `programassignmentid` + `programdaykey`.
- `workoutSessions`
  - Canonical columns are snake_case: `clientid`, `trainerid`, `assignmentid`, `workouttemplateid`, `startedat`, `finishedat`, `durationsec`, `status`.
- `workoutSetLogs`
  - Canonical uniqueness key is `(sessionid, serieskey, exercisekey, setindex)`.
  - Runtime values are tracked in `actualreps`, `actualweightkg`, and `iscompleted`.

## RLS Model

- Trainer/client link (`trainerClients`) is the authorization spine for assignment/session data.
- Sensitive runtime tables require RLS + explicit policies:
  - `clientProgramAssignments`
  - `clientWorkoutAssignments`
  - `workoutSessions`
  - `workoutSetLogs`
  - `workoutStatsDaily`
- Series/prescription tables are readable when user owns workout or is assigned that workout through `clientWorkoutAssignments`.

## RPC Catalog (client-facing)

- `anvil_assign_program_to_client(p_client_id, p_program_template_id, p_start_date, p_notes)`
- `generate_program_workout_assignments(p_program_assignment_id, p_replace_existing default false)`
- `assign_client_workout_template(p_client_id, p_workout_id, p_scheduled_for, p_source default 'manual', p_program_assignment_id default null, p_program_day_key default null)`
- `anvil_upsert_trainer_client_management(p_client_id, p_client_status, p_coach_notes, p_tags, p_check_in_frequency, p_next_check_in_at)`
- `anvil_set_trainer_client_status(p_client_id, p_status)`
- `anvil_mark_client_checkin(p_client_id, p_next_check_in_at)`
- `reactivate_client_program_assignment(p_assignment_id)`
- `reset_client_program_assignment_progress(p_assignment_id)`
- `unassign_program_from_client(p_assignment_id)`
- `update_program_assignment_start_date(p_assignment_id, p_start_date)`
- `update_workout_assignment_date(p_assignment_id, p_scheduled_for)`
- `unassign_workout_from_client(p_assignment_id)`
- `mark_program_day_complete(p_program_assignment_id, p_day_key)`
- `unmark_program_day_complete(p_program_assignment_id, p_day_key)`
- `get_my_program_assignments()`
- `get_my_workout_schedule(p_from, p_to)`

## Storage Security Model

- `avatars` and `logos` buckets:
  - Read: authenticated users.
  - Insert/Update/Delete: only authenticated user under own folder prefix (`{auth.uid()}/...`).
- Legacy duplicate policies are removed; policy names are normalized to one policy per operation.

