# Row-Level Security Policies

Every public table has RLS **enabled**. This document lists each policy verbatim from `pg_policies` (May 2026).

## Conventions

- `auth.uid()` returns the JWT subject (the user's id).
- `link_status` enum: `active | archived`.
- For UPDATE, the row must be visible via the SELECT path **and** match the UPDATE policy. If a row isn't visible, the update silently affects 0 rows.

> ⚠ Performance: many policies re-evaluate `auth.uid()` per row → 83 `auth_rls_initplan` advisor warnings. Wrap in `(select auth.uid())` to push the call to a single eval. Tracked in tech debt.

---

## `users`

| Policy | CMD | Roles | USING | WITH CHECK |
| --- | --- | --- | --- | --- |
| `users_read_own` | SELECT | public | `auth.uid() = id` | — |
| `users_select_own` | SELECT | authenticated | `auth.uid() = id` | — |
| `users_select_trainer_linked_clients` | SELECT | authenticated | trainer of `id` via active/archived `trainerClients` | — |
| `users_select_client_linked_trainer` | SELECT | authenticated | client of `id` via active/archived `trainerClients` | — |
| `users_update_own` | UPDATE | public | `auth.uid() = id` | `auth.uid() = id` |

## `clientProfiles`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `clientprofiles_select_own` | SELECT | authenticated | `auth.uid() = userId` |
| `clientprofiles_select_trainer_linked` | SELECT | authenticated | active or archived link |
| `clientprofiles_update_notes_trainer_linked` | UPDATE | authenticated | active link |
| `client_profiles_select_own` | SELECT | public | duplicate (older) |
| `client_profiles_select_trainer_linked` | SELECT | public | active link only |
| `client_profiles_update_own` | ALL | public | own row |

> Older `client_profiles_*` policies on `public` should be dropped after verifying the newer `clientprofiles_*` policies cover the same surface area. Tech debt.

## `trainerProfiles`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `trainerprofiles_select_own` | SELECT | public | `auth.uid() = userId` |
| `trainer_profiles_select_own` | SELECT | public | duplicate of above |
| `trainer_profiles_select_client_linked` | SELECT | authenticated | client → trainer (active/archived) |
| `trainerprofiles_insert_own` | INSERT | public | `auth.uid() = userId` |
| `trainerprofiles_update_own` | UPDATE | public | own row |
| `trainer_profiles_update_own` | UPDATE | public | duplicate |

## `trainerClients`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `trainer_clients_select_participant` | SELECT | authenticated | trainer or client |
| `trainer_clients_insert_trainer` | INSERT | authenticated | `auth.uid() = trainerId` |
| `trainer_clients_update_trainer` | UPDATE | authenticated | trainer |

## `trainerClientManagement`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `trainerclientmanagement_select_trainer` | SELECT | authenticated | own as trainer |
| `trainerclientmanagement_select_client` | SELECT | authenticated | own as client |

> No INSERT/UPDATE policies — writes go through `SECURITY DEFINER` RPCs (`anvil_upsert_trainer_client_management`, `anvil_mark_client_checkin`, …).

## `trainerInvites`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `trainer_invites_select_trainer` | SELECT | public | own as trainer |
| `trainer_invites_insert_trainer` | INSERT | public | `auth.uid() = trainerId` |
| `trainer_invites_update_trainer` | UPDATE | public | own |
| `trainer_invites_delete_trainer` | DELETE | public | own |

## `trainerRequests`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `trainer_requests_select_client` | SELECT | public | `auth.uid() = clientId` |
| `trainer_requests_select_trainer` | SELECT | public | `trainerEmail = (select email from users where id = auth.uid())` |
| `trainer_requests_insert_client` | INSERT | public | `auth.uid() = clientId` |
| `trainer_requests_update_client_cancel` | UPDATE | public | `auth.uid() = clientId` |
| `trainer_requests_update_trainer` | UPDATE | public | trainerEmail = own |

## `templateShares`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `templateshares_select` | SELECT | authenticated | sharer or recipient |
| `templateshares_insert` | INSERT | authenticated | `sharedByTrainerId = auth.uid()` |
| `templateshares_update` | UPDATE | authenticated | sharer |
| `templateshares_delete` | DELETE | authenticated | sharer |

## `assetEditHistory`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `assetedithistory_select` | SELECT | authenticated | actor |
| `assetedithistory_insert` | INSERT | authenticated | `actorTrainerId = auth.uid()` |

## `setTypes`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `settypes_select` | SELECT | authenticated | `true` (everyone authed) |

## `exercises`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `exercises_select` | SELECT | authenticated | `isStock=true OR ownerTrainerId=auth.uid() OR shared via templateShares (any permission, not revoked)` |
| `exercises_insert` | INSERT | authenticated | `isStock=false AND ownerTrainerId=auth.uid()` |
| `exercises_update` | UPDATE | authenticated | owner OR shared-with-`edit` ⚠ `WITH CHECK true` (effectively unguarded WITH CHECK; mitigated by USING) — security advisor `rls_policy_always_true` |
| `exercises_delete` | DELETE | authenticated | `ownerTrainerId = auth.uid()` |

## `programTemplates`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `programtemplates_select` | SELECT | authenticated | owner OR shared (any) |
| `programtemplates_insert` | INSERT | authenticated | `ownerTrainerId = auth.uid()` |
| `programtemplates_update` | UPDATE | authenticated | owner OR shared-with-`edit` ⚠ `WITH CHECK true` — security advisor `rls_policy_always_true` |
| `programtemplates_delete` | DELETE | authenticated | owner |

## `programPhases` / `programPhaseDays`

Both have `…_select`, `…_all`, `…_write` policies. `…_select` requires the user to own the parent template OR have any-permission share. `…_write`/`…_all` require owner OR shared-with-`edit`.

## `workouts`

| Policy | CMD | Roles | Notes |
| --- | --- | --- | --- |
| `workouts_select_own` | SELECT | authenticated | `auth.uid() = trainerId` |
| `workouts_select_assigned_client` | SELECT | authenticated | exists `clientWorkoutAssignments` row for `auth.uid()` |
| `workouts_insert_own` | INSERT | authenticated | trainer |
| `workouts_update_own` | UPDATE | authenticated | trainer |
| `workouts_delete_own` | DELETE | authenticated | trainer |

## `workoutSeriesBlocks` / `workoutSeriesExercises` / `workoutSetPrescriptions`

| Policy | CMD | Notes |
| --- | --- | --- |
| `…_select_accessible` | SELECT | workout owner OR assigned client (chains through `workouts` and `clientWorkoutAssignments`) |
| `…_write_owner` | ALL | workout owner only |

## `clientProgramAssignments`

| Policy | CMD | Notes |
| --- | --- | --- |
| `client_program_assignments_select_participant` | SELECT | client OR trainer-with-active-or-archived-link |
| `client_program_assignments_insert_trainer` | INSERT | trainer with active link |
| `client_program_assignments_update_client` | UPDATE | client (used to mark/unmark days) |
| `client_program_assignments_update_trainer` | UPDATE | trainer with link |
| `client_program_assignments_delete_trainer` | DELETE | trainer |

## `clientWorkoutAssignments`

| Policy | CMD | Notes |
| --- | --- | --- |
| `client_workout_assignments_select_participant` | SELECT | client OR trainer-with-link |
| `client_workout_assignments_insert_trainer` | INSERT | trainer with active link |
| `client_workout_assignments_update_participant` | UPDATE | trainer or client |
| `client_workout_assignments_delete_trainer` | DELETE | trainer |

## `workoutSessions`

| Policy | CMD | Notes |
| --- | --- | --- |
| `workout_sessions_select_participant` | SELECT | client or trainer |
| `workout_sessions_insert_client` | INSERT | client; if `assignmentid` set, must own the assignment |
| `workout_sessions_update_participant` | UPDATE | participant |
| `workout_sessions_delete_trainer` | DELETE | trainer |

## `workoutSetLogs`

| Policy | CMD | Notes |
| --- | --- | --- |
| `workout_set_logs_select_participant` | SELECT | session participant |
| `workout_set_logs_insert_participant` | INSERT | session participant |
| `workout_set_logs_update_participant` | UPDATE | session participant |
| `workout_set_logs_delete_participant` | DELETE | session participant |

## `workoutStatsDaily`

| Policy | CMD | Notes |
| --- | --- | --- |
| `workout_stats_daily_select_own` / `_insert_own` / `_update_own` / `_delete_own` | SELECT/INSERT/UPDATE/DELETE | `auth.uid() = clientid` |

## Storage policies

See [`storage.md`](./storage.md). Buckets `avatars` and `logos` have public read; only the owner (folder = `auth.uid()`) can write/delete. `pdfs` is private (no public read policy).

## Outstanding security warnings

Pulled from `get_advisors` (May 2026):

- `rls_policy_always_true`: `exercises_update`, `programtemplates_update`.
- `pg_graphql_anon_table_exposed`: 15 tables visible to `anon` via GraphQL `SELECT`.
- `pg_graphql_authenticated_table_exposed`: 23 tables visible to `authenticated` via GraphQL.
- `anon_security_definer_function_executable`: 53 RPCs callable by `anon`.
- `authenticated_security_definer_function_executable`: 53 RPCs callable by `authenticated` (expected for most).
- `function_search_path_mutable`: 15 functions need `SET search_path = public`.
- `public_bucket_allows_listing`: `avatars`, `logos`.
- `auth_leaked_password_protection`: disabled.

All triaged in [`/docs/decisions/technical-debt.md`](../decisions/technical-debt.md).

## Last Updated

2026-05-03 — initial documentation generated.
