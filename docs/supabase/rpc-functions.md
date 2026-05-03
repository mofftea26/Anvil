# RPC Functions

Every callable function in the `public` schema, grouped by domain. All `anvil_*` and `assign_*` functions are `SECURITY DEFINER` and rely on internal helpers (`_require_auth_uid`, `_require_trainer_link`) for authorization.

> ⚠ **Caller surface**: 53 RPCs are callable by both `anon` and `authenticated` (security advisor). Most should be revoked from `anon`. Tracked in tech debt.

## Internal helpers

### `_require_auth_uid()`
- **Type**: SQL function (PL/pgSQL).
- **Returns**: `uuid`.
- **Security**: `SECURITY DEFINER`.
- **Purpose**: Returns `auth.uid()` or raises if null.
- **Last Updated**: 2026-05-03.

### `_require_trainer_link(p_trainer_id uuid, p_client_id uuid)`
- **Type**: PL/pgSQL.
- **Returns**: `void`.
- **Security**: `SECURITY DEFINER`.
- **Purpose**: Raises if there is no `trainerClients` row with `status='active'` for the given pair.
- **Tables Used**: `trainerClients`.
- **Called From**: most `anvil_*` and `assign_*` RPCs.

### `try_uuid(p_text)`
- Coerces text to uuid; returns null on failure.

### `jsonb_int(p_obj, p_key, p_default)`, `set_rest_sec(p_set, p_default)`
- JSONB helpers used in `add_series_durations_to_state`.

### `add_series_durations_to_state(p_state jsonb)` → `jsonb`
- Computes per-series and total durations and writes them back into the `state` JSON.

---

## Linking & invites

### `anvil_create_trainer_invite(p_target_email text, p_expires_at timestamptz)`
- **Type**: RPC (`SECURITY DEFINER`).
- **Returns**: `trainerInvites` row.
- **Inputs**: optional target email, optional expiry.
- **Tables Used**: `trainerInvites`.
- **RLS / Security Notes**: Caller must be authenticated; `trainerId` set to `auth.uid()`.
- **Called From**: `features/linking/api/linkingApiSlice.ts`.
- **Error Cases**: missing auth.

### `anvil_redeem_invite_code(p_code text)`
- **Returns**: `trainerClients` row.
- **Tables Used**: `trainerInvites`, `trainerClients`, `trainerClientManagement` (via trigger).
- **Security**: `SECURITY DEFINER`. Verifies code is `pending` and not expired; sets `redeemedBy = auth.uid()` and inserts/activates the link.
- **Called From**: client-side linking screens.

### `anvil_create_trainer_request(p_trainer_email text, p_message text)`
- **Returns**: `trainerRequests`.
- **Tables Used**: `trainerRequests`, `users` (snapshot).
- **Security**: `SECURITY DEFINER`. `clientId = auth.uid()`.

### `anvil_accept_trainer_request(p_request_id uuid)` / `anvil_decline_trainer_request` / `anvil_cancel_trainer_request`
- Mutate request status; `accept` also creates the `trainerClients` row.
- **Tables Used**: `trainerRequests`, `trainerClients`.

### `get_trainer_requests_inbox(p_trainer_email text)`
- **Returns**: `TABLE(...)` of inbox rows with client snapshot.
- **Security**: `SECURITY DEFINER` (allows trainer to read by email; the function checks the email matches `auth.uid()`'s user).

### `anvil_set_trainer_client_status(p_client_id uuid, p_status link_status)`
- Sets `trainerClients.status` (active/archived). Trainer-only.

### `anvil_upsert_trainer_client_management(p_client_id, p_client_status, p_coach_notes, p_tags, p_check_in_frequency, p_next_check_in_at)`
- Upserts the management row.
- **Tables Used**: `trainerClientManagement`, `trainerClients` (link check).

### `anvil_mark_client_checkin(p_client_id, p_next_check_in_at)`
- Stamps `lastCheckInAt = now()` and sets `nextCheckInAt`.

### `anvil_delete_archived_client_link(p_client_id)`
- Permanently removes a link. Only allowed if `status='archived'`.

### `anvil_client_cancel_trainer(p_trainer_id)`
- Client-initiated unlink.

### `anvil_client_set_relationship_status(p_trainer_id, p_status, p_pause_reason)`
- Client toggles `clientRelationshipStatus` on the management row (active/paused/cancelled).

### `anvil_generate_invite_code(p_prefix text)`
- Internal helper (used by `anvil_create_trainer_invite`).

### `anvil_ensure_management_row()` (trigger fn)
- Creates the `trainerClientManagement` row when a `trainerClients` row is inserted.

### `set_trainer_request_client_snapshot()` (trigger fn)
- Snapshots the requesting client's name/avatar onto the request row.

---

## Programs

### `anvil_create_program_template(p_title, p_description, p_difficulty, p_duration_weeks, p_state)`
- **Returns**: `programTemplates`.
- **Tables Used**: `programTemplates`.

### `anvil_update_program_template_meta(p_template_id, p_title, p_description, p_difficulty, p_duration_weeks)`
- Update metadata.

### `anvil_update_program_template_state(p_template_id, p_state)`
- Replace the JSONB `state`.

### `anvil_set_program_template_status(p_template_id, p_status)`
- Set `status` enum.

### `anvil_set_program_template_archived(p_template_id, p_is_archived)`
- Toggle `isArchived`.

### `anvil_clone_program_template(p_source_template_id, p_new_title)`
- Returns a new `programTemplates` row with copied state and `sourceTemplateId` set.

### `anvil_get_program_template(p_template_id)`
- SQL function. Returns the row or null.

### `anvil_can_view_program_template(p_template_id)` / `anvil_can_edit_program_template(p_template_id)`
- SQL boolean helpers used by RLS / app code.

### `anvil_extract_planned_workouts_from_state(p_state jsonb)` → `TABLE(daykey text, workoutid uuid)`
- Parses a program `state` and yields all (day key, workout id) pairs. Used by `generate_program_workout_assignments`.

### `anvil_program_children_bump_trigger()` / `anvil_workout_children_bump_trigger()` (trigger fns)
- Bump audit timestamps on the parent template/workout when child rows change.

### `anvil_set_template_audit_fields()` (trigger fn)
- Populates `createdByTrainerId`, `lastEditedByTrainerId`, etc.

### `anvil_lock_creator_owner_fields()` (trigger fn)
- Prevents UPDATE from changing creator/owner fields.

### `anvil_touch_program_template_timestamps()` (trigger fn)
- Touches `updatedAt`/`lastEditedAt`.

---

## Program assignment

### `anvil_assign_program_to_client(p_client_id uuid, p_program_template_id uuid, p_start_date date, p_notes text)`
- **Returns**: `clientProgramAssignments`.
- **Tables Used**: `clientProgramAssignments`, `trainerClients` (link check).
- **Security**: trainer must have an active link.
- **Called From**: `features/clients/api/assignments.api.ts`, `features/library` UI.

### `generate_program_workout_assignments(p_program_assignment_id uuid, p_replace_existing boolean)` → `int`
- Materializes per-day `clientWorkoutAssignments` from the program's `state`. Returns the number of rows generated.
- **Tables Used**: `clientProgramAssignments`, `programTemplates`, `clientWorkoutAssignments`.

### `mark_program_day_complete(p_program_assignment_id, p_day_key)` / `unmark_program_day_complete(...)`
- Mutates `clientProgramAssignments.progress` JSONB. Client side.

### `update_program_assignment_start_date(p_assignment_id, p_start_date)`
- Adjusts the program start date and (potentially) regenerates the schedule.

### `archive_client_program_assignment(p_assignment_id)` / `reactivate_client_program_assignment` / `unassign_program_from_client` / `reset_client_program_assignment_progress`
- Lifecycle controls.

### `get_my_program_assignments()` → `SETOF clientProgramAssignments`
- Returns the calling client's program assignments.

### `get_trainer_client_program_assignments(p_client_id)` → `SETOF clientProgramAssignments`
- Trainer reads a client's program assignments (link check).

---

## Workout assignment

### `assign_client_workout(p_client_id, p_workout_id, p_scheduled_for, p_source, p_program_assignment_id, p_program_day_key)`
- Inserts a `clientWorkoutAssignments` row. Older variant.

### `assign_client_workout_template(...)` (with `p_overwrite_existing`)
- Newer variant; can replace an existing assignment for the same `(clientid, workoutid, scheduledfor)` pair.

### `assign_client_workout_bulk(...)` / `assign_client_workout_template_bulk(...)`
- `SETOF`-returning bulk versions used by `AssignToClientsSheet`.

### `update_workout_assignment_date(p_assignment_id, p_scheduled_for)`
- Reschedules.

### `archive_client_workout_assignment` / `reactivate_client_workout_assignment` / `unassign_workout_from_client`
- Lifecycle.

### `get_my_workout_schedule(p_from date, p_to date)` → `SETOF clientWorkoutAssignments`
- Returns the calling client's assignments in `[p_from, p_to]`. Optimized for the indexed `(clientid, scheduledfor)` read.

---

## Workout sessions

### `anvil_start_workout_session(p_assignment_id uuid)` → `workoutSessions`
- Creates a new `in_progress` session if none exists for the assignment, else returns the existing one. Stores `clientid`, `trainerid`, `workouttemplateid` from the assignment.

### `anvil_finish_workout_session(p_session_id uuid, p_duration_sec integer)` → `workoutSessions`
- Sets `finishedat = now()`, `status='completed'`, `durationsec`.

---

## Auth & users

### `handle_new_auth_user()` (trigger fn)
- Inserts a `public.users` row when an `auth.users` row is created. **Verified 2026-05-03**: trigger `on_auth_user_created` on `auth.users` (AFTER INSERT) calls `public.handle_new_auth_user()` (`SECURITY DEFINER`).

### `prevent_role_change_if_confirmed()` (trigger fn)
- BEFORE UPDATE on `users`: blocks `role` change when `roleConfirmed = true`.

### `create_trainer_profile_on_role_change()` (trigger fn)
- AFTER UPDATE on `users`: when `role` becomes `trainer`, inserts a default `trainerProfiles` row.

### `set_users_updated_at()` / `set_updated_at()` / `set_updated_at_simple()` / `setUpdatedAt()` (trigger fns)
- BEFORE UPDATE: bump `updatedAt`. Multiple variants exist for historical reasons — consolidate.

---

## Misc

### `trg_workouts_add_series_durations()` (trigger fn)
- BEFORE INSERT/UPDATE on `workouts`: calls `add_series_durations_to_state(state)` to enrich the JSON with computed durations.

---

## Calling conventions from the app

- All RPCs are invoked through `supabase.rpc(name, params)` from the `*.api.ts` files. The frontend never `fetch`-es PostgREST endpoints directly.
- Errors are surfaced via `appToast.error` after the calling hook unwraps them.
- Many `anvil_*` functions return one row of a table type (`"trainerClients"`, etc.); the JS SDK exposes them as `data: SingleRow`.

## Client-facing RPC catalog (quick reference)

The most commonly-called RPCs from the frontend, with parameter signatures. (Folded in from the former `supabase/ARCHITECTURE_NOTES.md`.)

```
anvil_assign_program_to_client(p_client_id, p_program_template_id, p_start_date, p_notes)
generate_program_workout_assignments(p_program_assignment_id, p_replace_existing default false)
assign_client_workout_template(
  p_client_id, p_workout_id, p_scheduled_for,
  p_source default 'manual',
  p_program_assignment_id default null,
  p_program_day_key default null
)
anvil_upsert_trainer_client_management(
  p_client_id, p_client_status, p_coach_notes, p_tags,
  p_check_in_frequency, p_next_check_in_at
)
anvil_set_trainer_client_status(p_client_id, p_status)
anvil_mark_client_checkin(p_client_id, p_next_check_in_at)
reactivate_client_program_assignment(p_assignment_id)
reset_client_program_assignment_progress(p_assignment_id)
unassign_program_from_client(p_assignment_id)
update_program_assignment_start_date(p_assignment_id, p_start_date)
update_workout_assignment_date(p_assignment_id, p_scheduled_for)
unassign_workout_from_client(p_assignment_id)
mark_program_day_complete(p_program_assignment_id, p_day_key)
unmark_program_day_complete(p_program_assignment_id, p_day_key)
get_my_program_assignments()
get_my_workout_schedule(p_from, p_to)
```

## Outstanding warnings

- 15 functions with mutable `search_path` — set `SET search_path = public` in each.
- 53 RPCs are callable by both `anon` and `authenticated`. For most, `revoke execute on function … from anon;` is appropriate.
- Document each function's caller surface deliberately, then run the security advisor again.

## Last Updated

2026-05-03 — initial documentation generated.
