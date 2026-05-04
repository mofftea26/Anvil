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
- **Kept for backward compatibility** with the legacy "mark check-in" pill. The new `clientCheckIns` table + RPCs (below) are the primary surface for trainer check-in scheduling.

### `anvil_get_trainer_clients_without_active_program()` → `TABLE(linkid uuid, clientid uuid, firstname text, lastname text, email text, avatarurl text, lastcheckinat timestamptz, clientstatus text)`

#### Type
RPC (`SECURITY DEFINER`).

#### Purpose
Lists the calling trainer's active clients who have **no** `clientProgramAssignments` row with `status='active'`. Powers the trainer dashboard `NoProgramCard` count and the `ClientsWithoutProgramScreen` (Phase D).

#### Inputs
- (none)

#### Output
- One row per client; ordered by `firstName, lastName` nulls last.

#### Tables Used
- `trainerClients`, `users`, `trainerClientManagement` (left join), `clientProgramAssignments`.

#### RLS / Security Notes
- `SECURITY DEFINER`. `SET search_path = public`.
- Caller scope: returns rows only where `trainerClients.trainerId = auth.uid()` and `status='active'`.
- `revoke … from public, anon`; `grant … to authenticated`.

#### Called From
- `useClientsWithoutActiveProgram` hook (Phase D).

#### Error Cases
- `Not authenticated`.

#### Last Updated
2026-05-04

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

### `anvil_get_program_progress(p_program_assignment_id uuid)` → `TABLE(daykey text, weekindex int, dayindex int, scheduledfor date, isrest boolean, workoutid uuid, status text)`

#### Type
RPC (`SECURITY DEFINER`).

#### Purpose
Returns the per-day progress timeline for a program assignment. Walks `programTemplates.state` (phase → week → day) deterministically, derives global `weekIndex`/`dayIndex` from `scheduled_for - startdate`, and resolves a status per row:

- `rest` — `dy.type = 'rest'`
- `completed` — there is a `clientWorkoutAssignments` row with `status='completed'` for this `(programassignmentid, programdaykey)` OR the day key is in `clientProgramAssignments.progress.completedDayKeys`
- `missed` — past day, not completed
- `pending` — today or future, not completed

#### Inputs
- `p_program_assignment_id uuid`

#### Output
`TABLE(daykey text, weekindex int, dayindex int, scheduledfor date, isrest boolean, workoutid uuid, status text)`. Ordered by `weekindex, dayindex`.

#### Tables Used
- `clientProgramAssignments`, `programTemplates`, `clientWorkoutAssignments`.

#### RLS / Security Notes
- `SECURITY DEFINER`. `SET search_path = public`.
- Authorization: caller must be the assignment's client OR the assignment's trainer with an active `trainerClients` link (validated by `_require_trainer_link`).
- `revoke execute … from public, anon`; `grant execute … to authenticated`.

#### Called From
- `useProgramProgress` hook (Phase C) — client-side `ProgramProgressScreen`.
- Server-side: `anvil_get_active_program_detail` (Phase A) for the aggregate counts.

#### Error Cases
- `Program assignment not found`.
- `Not allowed` (caller is neither client nor linked trainer).
- `Program template state not found`.

#### Last Updated
2026-05-04

### `anvil_get_active_program_detail(p_assignment_id uuid)` → composite TABLE row

#### Type
RPC (`SECURITY DEFINER`).

#### Purpose
Single round-trip read for the active program card. Joins `clientProgramAssignments` + `programTemplates` and aggregates the day counts produced by `anvil_get_program_progress`.

#### Inputs
- `p_assignment_id uuid`

#### Output
`TABLE(assignmentid uuid, startdate date, status text, notes text, templateid uuid, title text, description text, difficulty text, durationweeks int, state jsonb, totaldays int, workoutdays int, restdays int, completeddays int, pendingdays int, misseddays int, expectedenddate date)` — exactly one row.

#### Tables Used
- `clientProgramAssignments`, `programTemplates`. Recursively calls `anvil_get_program_progress` for the counts (which reads `clientWorkoutAssignments`).

#### RLS / Security Notes
- Same authorization as `anvil_get_program_progress`.
- `revoke … from public, anon`; `grant … to authenticated`.

#### Called From
- `useActiveProgramDetail` hook (Phase C) — `ClientMyProgramScreen` and `ProgramProgressScreen` info section.

#### Error Cases
- `Program assignment not found`, `Program template not found`, `Not allowed`.

#### Last Updated
2026-05-04

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

## Check-ins

> See [`tables.md#clientcheckins`](./tables.md#clientcheckins). All four are `SECURITY DEFINER` and revoked from `anon`.

### `anvil_get_trainer_checkins_by_date(p_date date)` → `TABLE(...)`

#### Purpose
Lists all `clientCheckIns` rows scheduled for `p_date` for the calling trainer, joined with `users` for the client snapshot (`firstName`, `lastName`, `avatarUrl`).

#### Output columns
`id, trainerid, clientid, scheduledfor, scheduledtime, sortorder, status, notes, metricsummary, createdat, updatedat, clientfirstname, clientlastname, clientavatarurl`. Ordered by `sortOrder, scheduledTime, createdAt`.

#### Security
- Caller-scoped via `auth.uid() = trainerId` (filtered in the SELECT).
- `revoke … from public, anon`; `grant … to authenticated`.

#### Called From
- `useTrainerCheckIns` hook (Phase D), `TrainerCheckInsTimelineScreen`.

### `anvil_upsert_client_checkin(p_id uuid, p_client_id uuid, p_scheduled_for date, p_scheduled_time time, p_status text, p_notes text, p_metric_summary text, p_sort_order int)` → `clientCheckIns`

#### Purpose
Insert when `p_id IS NULL`, otherwise update the row (only if it belongs to the calling trainer).

- Validates the trainer ↔ client active link via `_require_trainer_link`.
- On insert with `p_sort_order IS NULL`, the function picks `max(sortOrder)+1` for the `(trainerId, scheduledFor)` group so new rows append to the end of the day.
- Validates `p_status ∈ scheduled|completed|missed|cancelled`.

#### Security
- `SECURITY DEFINER`. `SET search_path = public`.
- `revoke … from public, anon`; `grant … to authenticated`.

#### Error Cases
- `Not authenticated`, `Client not linked`, `Invalid check-in status`, `Check-in not found or not owned by caller`.

### `anvil_reorder_client_checkin(p_checkin_id uuid, p_sort_order int, p_scheduled_time time, p_scheduled_for date)` → `clientCheckIns`

#### Purpose
Used after a drag/drop. Updates `sortOrder` and optionally `scheduledTime` / `scheduledFor` on a single row. Caller must own the row (`trainerId = auth.uid()`).

#### Security
- `SECURITY DEFINER`. `revoke … from public, anon`; `grant … to authenticated`.

### `anvil_delete_client_checkin(p_id uuid)` → `boolean`

#### Purpose
Hard-delete a check-in slot owned by the caller.

#### Security
- `SECURITY DEFINER`. `revoke … from public, anon`; `grant … to authenticated`.

#### Error Cases
- `Check-in not found or not owned by caller`.

---

## Misc

### `trg_workouts_add_series_durations()` (trigger fn)
- BEFORE INSERT/UPDATE on `workouts`: calls `add_series_durations_to_state(state)` to enrich the JSON with computed durations.

### `anvil_session_completion_sync_trigger()` (trigger fn — Phase A)
- AFTER UPDATE on `workoutSessions`. When a session transitions into `status='completed'`, marks the linked `clientWorkoutAssignments` row complete and appends the `programdaykey` to `clientProgramAssignments.progress.completedDayKeys` (with `lastCompletedAt`). EXECUTE revoked from all roles — only the trigger event invokes it. See [`triggers.md`](./triggers.md).

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
anvil_get_program_progress(p_program_assignment_id)
anvil_get_active_program_detail(p_assignment_id)
anvil_get_trainer_clients_without_active_program()
anvil_get_trainer_checkins_by_date(p_date)
anvil_upsert_client_checkin(p_id, p_client_id, p_scheduled_for, p_scheduled_time, p_status, p_notes, p_metric_summary, p_sort_order)
anvil_reorder_client_checkin(p_checkin_id, p_sort_order, p_scheduled_time, p_scheduled_for)
anvil_delete_client_checkin(p_id)
```

## Outstanding warnings

- 15 functions with mutable `search_path` — set `SET search_path = public` in each.
- 53 RPCs are callable by `anon` (Phase A's 7 new RPCs are explicitly revoked from `anon` — they don't add to this count). 60 RPCs are callable by `authenticated` (+7 from Phase A; intentional).
- Document each function's caller surface deliberately, then run the security advisor again.

## Last Updated

2026-05-04 — added `anvil_get_program_progress`, `anvil_get_active_program_detail`, `anvil_get_trainer_clients_without_active_program`, and the four `clientCheckIns` RPCs (Phase A overhaul). Also documented `anvil_session_completion_sync_trigger`.
