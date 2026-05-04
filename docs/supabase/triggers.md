# Triggers

All triggers in the `public` schema (May 2026).

| Table | Trigger | When | Function | Purpose |
| --- | --- | --- | --- | --- |
| `exercises` | `trg_exercises_audit` | BEFORE INSERT/UPDATE | `anvil_set_template_audit_fields` | Populate `createdByTrainerId`, `lastEditedByTrainerId`, etc. |
| `exercises` | `trg_exercises_lock` | BEFORE UPDATE | `anvil_lock_creator_owner_fields` | Prevent UPDATE from changing creator/owner fields |
| `programPhaseDays` | `trg_programphasedays_bump` | AFTER INSERT/UPDATE/DELETE | `anvil_program_children_bump_trigger` | Bump parent template's audit fields |
| `programPhases` | `trg_programphases_bump` | AFTER INSERT/UPDATE/DELETE | `anvil_program_children_bump_trigger` | Same |
| `programTemplates` | `trg_programtemplates_audit` | BEFORE INSERT/UPDATE | `anvil_set_template_audit_fields` | Audit fields |
| `programTemplates` | `trg_programtemplates_lock` | BEFORE UPDATE | `anvil_lock_creator_owner_fields` | Lock creator/owner |
| `programTemplates` | `trg_programtemplates_touch_timestamps` | BEFORE UPDATE | `anvil_touch_program_template_timestamps` | Bump `updatedAt` / `lastEditedAt` |
| `trainerClientManagement` | `trg_trainerclientmanagement_updatedat` | BEFORE UPDATE | `set_updated_at` | Bump `updatedAt` |
| `trainerClients` | `trg_trainerclients_ensuremanagement` | AFTER INSERT | `anvil_ensure_management_row` | Create matching `trainerClientManagement` row |
| `trainerRequests` | `trg_set_trainer_request_client_snapshot` | BEFORE INSERT/UPDATE | `set_trainer_request_client_snapshot` | Snapshot client name/avatar |
| `users` | `trg_create_trainer_profile_on_role_change` | AFTER UPDATE | `create_trainer_profile_on_role_change` | Insert `trainerProfiles` row when role becomes `trainer` |
| `users` | `trg_users_prevent_role_change_if_confirmed` | BEFORE UPDATE | `prevent_role_change_if_confirmed` | Block role change post-confirmation |
| `users` | `trg_users_updated_at` | BEFORE UPDATE | `set_users_updated_at` | Bump `updatedAt` |
| `workoutSeriesBlocks` | `trg_workoutseriesblocks_bump` | AFTER INSERT/UPDATE/DELETE | `anvil_workout_children_bump_trigger` | Bump parent workout's audit |
| `workoutSeriesExercises` | `trg_workoutseriesexercises_bump` | AFTER INSERT/UPDATE/DELETE | `anvil_workout_children_bump_trigger` | Same |
| `workoutSetPrescriptions` | `trg_workoutsetprescriptions_bump` | AFTER INSERT/UPDATE/DELETE | `anvil_workout_children_bump_trigger` | Same |
| `workouts` | `trg_workouts_add_series_durations` | BEFORE INSERT/UPDATE | `trg_workouts_add_series_durations` | Inject computed durations into `state` |
| `workouts` | `trg_workouts_updated_at` | BEFORE UPDATE | `set_updated_at` | Bump `updatedAt` |
| `workouts` | `workouts_set_updated_at` | BEFORE UPDATE | `set_updated_at` | **Duplicate** of above — drop one (tech debt) |
| `workoutSessions` | `anvil_session_completion_sync_trigger` | AFTER UPDATE | `anvil_session_completion_sync_trigger` | When session transitions into `status='completed'`, marks the linked `clientWorkoutAssignments` row complete and appends `programdaykey` into the parent program's `progress.completedDayKeys` (with `lastCompletedAt`). |
| `clientCheckIns` | `trg_clientcheckins_updatedat` | BEFORE UPDATE | `set_updated_at` | Bump `updatedAt`. |

## Trigger function security model

- All `anvil_*` and `set_trainer_request_client_snapshot` are `SECURITY DEFINER` so they can write to columns the user might not be able to write directly via RLS.
- `set_updated_at*` are `SECURITY INVOKER` (no need for elevated rights).

## auth schema triggers

- The function `handle_new_auth_user()` exists in `pg_proc` and is intended to insert a matching `public.users` row when `auth.users` gets a new row. **Needs verification** that a trigger on `auth.users` calls it (the inspection above only covered `public` triggers).

## Notes on `anvil_session_completion_sync_trigger`

- `EXECUTE` on the trigger function is revoked from `public, anon, authenticated`; the function is reachable only via the trigger row event.
- It is idempotent: it fires on the OLD→NEW transition into `status='completed'` only. Re-completion is a no-op (the inner UPDATE has `where status <> 'completed'`).
- It overlaps slightly with `anvil_finish_workout_session` (the canonical RPC also updates the assignment), but the two together cover both code paths: RPC-driven finishes _and_ direct UPDATEs (e.g. trainer corrections, future bulk imports).

## Last Updated

2026-05-04 — added `anvil_session_completion_sync_trigger` and `trg_clientcheckins_updatedat` (Phase A).
