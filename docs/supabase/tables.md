# Tables

Detailed reference for every public table. Each table follows the template in [`/AGENTS.md`](../../AGENTS.md#table-doc-template).

For relationships, see [`relationships.md`](./relationships.md). For RLS policies, see [`rls-policies.md`](./rls-policies.md).

> All public tables have RLS **enabled**. The `Indexes` lists are the active state from `pg_indexes`.

---

## `users`

### Purpose
App-level user. 1:1 with `auth.users`.

### Columns
| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `uuid` | NO | (FK to `auth.users.id`) |
| `email` | `text` | NO | — |
| `role` | `user_role` | NO | `'client'` |
| `avatarUrl` | `text` | YES | — |
| `firstName` | `text` | YES | — |
| `lastName` | `text` | YES | — |
| `roleConfirmed` | `boolean` | NO | `false` |
| `createdAt` | `timestamptz` | NO | `now()` |
| `updatedAt` | `timestamptz` | NO | `now()` |

### Relationships
- PK `id` → FK `auth.users.id`.
- Referenced by every profile / link / asset table via `userId`/`trainerId`/`clientId`.

### Indexes
- `users_pkey` (`id`)
- `users_email_key` (`email`, unique)

### RLS Policies
- `users_read_own` (SELECT, public): `auth.uid() = id`
- `users_select_own` (SELECT, authenticated): same
- `users_update_own` (UPDATE, public): `auth.uid() = id`
- `users_select_trainer_linked_clients` (SELECT, authenticated): trainer can see linked client rows (active or archived)
- `users_select_client_linked_trainer` (SELECT, authenticated): client can see linked trainer rows

### Used By Frontend Features
- `auth`, `onboarding`, `profile`, `clients`, `linking` (everywhere).

### Used By Functions
- `_require_auth_uid`, `handle_new_auth_user`, every `SECURITY DEFINER` RPC that calls `_require_trainer_link`.

### Notes
- `prevent_role_change_if_confirmed` trigger blocks role flip after `roleConfirmed=true`.

### Last Updated
2026-05-03

---

## `clientProfiles`

### Purpose
Client-only profile fields.

### Columns
| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| `userId` | `uuid` | NO | PK + FK `users.id` |
| `phone` | `text` | YES | — |
| `nationality` | `text` | YES | — |
| `gender` | `gender_type` | YES | — |
| `birthDate` | `date` | YES | — |
| `heightCm` | `numeric` | YES | — |
| `weightKg` | `numeric` | YES | — |
| `target` | `text` | YES | — |
| `activityLevel` | `text` | YES | — |
| `unitSystem` | `unit_system` | NO | `'metric'` |
| `notes` | `text` | YES | — |
| `createdAt` | `timestamptz` | NO | `now()` |
| `updatedAt` | `timestamptz` | NO | `now()` |

### Indexes
- `clientProfiles_pkey` (`userId`)

### RLS Policies
- Self read/update; linked trainer read; trainer can update notes (active link only).
  See `clientprofiles_select_own`, `clientprofiles_select_trainer_linked`, `clientprofiles_update_notes_trainer_linked` and the older `client_profiles_*` policies in [`rls-policies.md`](./rls-policies.md).

### Used By Frontend Features
- `profile` (client side), `clients` (trainer reads).

### Notes
- `unitSystem` drives weight/height display in the client UI.

### Last Updated
2026-05-03

---

## `trainerProfiles`

### Purpose
Trainer-only brand and bio fields.

### Columns
| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| `userId` | `uuid` | NO | PK + FK `users.id` |
| `phone`, `brandName`, `primaryColor`, `secondaryColor`, `logoUrl`, `bio`, `certifications`, `instagram`, `website` | `text` | YES | — |
| `createdAt`, `updatedAt` | `timestamptz` | NO | `now()` |

### Indexes
- `trainerProfiles_pkey` (`userId`)

### RLS Policies
- Self read/insert/update; linked client read.

### Used By Frontend Features
- `profile` (trainer side), brand-aware `ThemeProvider`.

### Last Updated
2026-05-03

---

## `trainerClients`

### Purpose
Link table — the spine of all authorization decisions.

### Columns
| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `trainerId` | `uuid` | NO | FK `users.id` |
| `clientId` | `uuid` | NO | FK `users.id` |
| `status` | `link_status` | NO | (no default — set by inserter) |
| `createdAt` | `timestamptz` | NO | `now()` |

### Indexes
- `trainer_clients_pkey` (`id`)
- `idx_trainer_clients_clientid` (`clientId`)
- `trainer_clients_trainer_id_client_id_key` (unique on (`trainerId`,`clientId`))
- `trainerclients_trainerid_clientid_key` (unique on same — duplicate; tracked in tech debt)

### RLS Policies
- `trainer_clients_select_participant`: either side
- `trainer_clients_insert_trainer`: trainer
- `trainer_clients_update_trainer`: trainer

### Used By Frontend Features
- `clients`, `linking`, every assignment screen.

### Triggers
- `trg_trainerclients_ensuremanagement` (AFTER INSERT) → creates the matching `trainerClientManagement` row via `anvil_ensure_management_row`.

### Last Updated
2026-05-03

---

## `trainerClientManagement`

### Purpose
Trainer-side per-client meta: notes, tags, check-in cadence, status.

### Columns
| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `trainerId` | `uuid` | NO | FK `users.id` |
| `clientId` | `uuid` | NO | FK `users.id` |
| `clientStatus` | `client_status` | NO | `'active'` |
| `coachNotes` | `text` | YES | — |
| `tags` | `text[]` | NO | `'{}'` |
| `checkInFrequency` | `checkin_frequency` | NO | `'weekly'` |
| `nextCheckInAt`, `lastCheckInAt` | `timestamptz` | YES | — |
| `clientRelationshipStatus` | `client_relationship_status` | NO | `'active'` |
| `clientPauseReason` | `text` | YES | — |
| `createdAt`, `updatedAt` | `timestamptz` | NO | `now()` |

### Indexes
- `trainerclientmanagement_pkey` (`id`)
- `idx_trainer_client_management_clientid` (`clientId`)
- `trainerclientmanagement_pair_uq` (unique on (`trainerId`,`clientId`))

### RLS Policies
- `trainerclientmanagement_select_trainer`: trainer
- `trainerclientmanagement_select_client`: client
- (writes go through `anvil_*` RPCs)

### Triggers
- `trg_trainerclientmanagement_updatedat` (BEFORE UPDATE) → `set_updated_at`.

### Last Updated
2026-05-03

---

## `trainerInvites`

### Purpose
Invite codes a trainer issues to onboard clients.

### Columns
| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `trainerId` | `uuid` | NO | FK `users.id` |
| `code` | `text` | NO | (unique) |
| `targetEmail` | `text` | YES | — |
| `status` | `invite_status` | NO | `'pending'` |
| `expiresAt` | `timestamptz` | YES | — |
| `redeemedBy` | `uuid` | YES | FK `users.id` |
| `redeemedAt` | `timestamptz` | YES | — |
| `createdAt` | `timestamptz` | NO | `now()` |

### Indexes
- `trainer_invites_pkey`, `trainer_invites_code_key` (unique), `idx_trainer_invites_trainerid`, `idx_trainer_invites_redeemedby`.

### RLS Policies
- `trainer_invites_*` — trainer read/insert/update/delete (own).

### Last Updated
2026-05-03

---

## `trainerRequests`

### Purpose
Client-initiated request to a trainer's email.

### Columns
| Column | Type | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `clientId` | `uuid` | NO | FK `users.id` |
| `trainerEmail` | `text` | NO | — |
| `status` | `request_status` | NO | `'pending'` |
| `message` | `text` | YES | — |
| `createdAt` | `timestamptz` | NO | `now()` |
| `resolvedAt` | `timestamptz` | YES | — |
| `clientFirstName`, `clientLastName`, `clientAvatarUrl` | `text` | YES | — (snapshot for trainer inbox display) |

### Indexes
- `trainer_requests_pkey`, `idx_trainer_requests_clientid`.

### RLS Policies
- `trainer_requests_select_client`: client
- `trainer_requests_select_trainer`: trainerEmail = own email
- `trainer_requests_insert_client`, `trainer_requests_update_client_cancel`, `trainer_requests_update_trainer`.

### Triggers
- `trg_set_trainer_request_client_snapshot` (BEFORE INSERT/UPDATE) → snapshots `firstName/lastName/avatarUrl`.

### Last Updated
2026-05-03

---

## `templateShares`

### Purpose
Sharing of `exercise`/`workout`/`program` assets between trainers.

### Columns
- `id`, `assetType anvil_asset_type`, `assetId uuid`, `sharedByTrainerId`, `sharedToTrainerId`, `permission anvil_share_permission` (`view|edit`), `createdAt`, `revokedAt`.

### Indexes
- `templateShares_pkey`, `idx_templateshares_asset`, `idx_templateshares_to`, `uq_templateshares_active` (unique partial: `(assetType,assetId,sharedToTrainerId) WHERE revokedAt IS NULL`).

### RLS Policies
- Sharer or recipient SELECT; sharer INSERT/UPDATE/DELETE.

### Last Updated
2026-05-03

---

## `assetEditHistory`

### Purpose
Append-only audit of edits performed on assets (used for shared exercises/workouts/programs).

### Columns
- `id`, `assetType`, `assetId`, `action text`, `actorTrainerId`, `actionAt`, `meta jsonb`.

### Indexes
- `assetEditHistory_pkey`, `idx_assetedithistory_asset` (`assetType`,`assetId`).

### RLS Policies
- `assetedithistory_insert`: actorTrainerId = auth.uid()
- `assetedithistory_select`: same

### Last Updated
2026-05-03

---

## `setTypes`

### Purpose
Dictionary of set types (e.g. warmup, working, drop, AMRAP).

### Columns
- `id`, `key text unique`, `title text`, `description text`, `category text default 'Foundational Sets'`, `orderIndex int default 0`, `createdAt`.

### RLS
- `settypes_select`: any authenticated user.

### Used By
- Workout builder (set type picker), workout runner (rendering).

### Last Updated
2026-05-03

---

## `exercises`

### Purpose
Library of exercises. Stock + owner + shared.

### Columns
- `id`, `title`, `instructions`, `imageUrl`, `videoUrl`, `isStock` bool, `ownerTrainerId`, `createdByTrainerId`, `createdAt`, `lastEditedByTrainerId`, `lastEditedAt`, `updatedAt`, `sourceTemplateId`, `isArchived`, `targetMuscles exercise_target_muscle[]`, `equipment exercise_equipment[]`.

### Indexes
- `exercises_pkey`, `idx_exercises_owner`, `idx_exercises_stock`, `idx_exercises_archived`.

### RLS
- See [`rls-policies.md`](./rls-policies.md): stock OR owner OR shared (read); owner-only insert; owner or shared-with-edit (update); owner-only delete.

### Triggers
- `trg_exercises_audit` (audit fields), `trg_exercises_lock` (immutable creator/owner).

### Last Updated
2026-05-03

---

## `workouts`

### Purpose
Workout template root. Carries a JSONB `state` with the entire structure (series → exercises → sets).

### Columns
- `id`, `trainerId`, `title text default 'Untitled Workout'`, `state jsonb`, `createdAt`, `updatedAt`.

### Indexes
- `workouts_pkey`, `workouts_trainer_id_idx`, `workouts_updated_at_idx`.

### RLS
- Owner CRUD; assigned client SELECT.

### Triggers
- `trg_workouts_add_series_durations` (BEFORE INSERT/UPDATE) — augments `state` with computed durations.
- `trg_workouts_updated_at` and `workouts_set_updated_at` (BEFORE UPDATE) — `set_updated_at` (duplicate; tracked in tech debt).

### Last Updated
2026-05-03

---

## `workoutSeriesBlocks` / `workoutSeriesExercises` / `workoutSetPrescriptions`

### Purpose
Normalized workout structure (legacy / parallel to `workouts.state`). New code prefers reading `state`.

### Schema highlights
- `workoutSeriesBlocks(id, workoutTemplateId fk workouts, orderIndex, label, blockType anvil_series_block_type, createdAt)`
- `workoutSeriesExercises(id, seriesBlockId fk, exerciseId fk exercises, orderIndex, trainerNote, createdAt)`
- `workoutSetPrescriptions(id, seriesExerciseId fk, setTypeId fk setTypes, repsTarget, restSeconds, tempo, orderIndex, createdAt)`

### RLS
- Read: workout owner OR assigned client.
- Write: workout owner only.

### Triggers
- All three have `…_bump` trigger → `anvil_workout_children_bump_trigger` to bump the parent workout's `updatedAt`.

### Last Updated
2026-05-03

---

## `programTemplates`

### Purpose
Program template root. Carries `state JSONB` with phases/days/workouts.

### Columns
- `id`, `ownerTrainerId`, `status anvil_template_status default 'draft'`, `title`, `description`, `durationWeeks int`, `createdByTrainerId`, `createdAt`, `lastEditedByTrainerId`, `lastEditedAt`, `updatedAt`, `sourceTemplateId`, `isArchived bool`, `difficulty anvil_program_difficulty default 'beginner'`, `state jsonb`, `isStock bool`.

### Indexes
- `programTemplates_pkey`, `idx_programTemplates_ownerTrainerId`, plus extended composites: `(_status)`, `(_difficulty)`, `(_isArchived)`, and a duplicate `idx_programtemplates_owner` (drop one — tech debt).

### RLS
- Owner CRUD; shared via `templateShares` for read & edit.
- ⚠ `programtemplates_update` policy has `WITH CHECK true` (security advisor `rls_policy_always_true`).

### Triggers
- `trg_programtemplates_audit`, `trg_programtemplates_lock`, `trg_programtemplates_touch_timestamps`.

### Last Updated
2026-05-03

---

## `programPhases` / `programPhaseDays`

### Purpose
Legacy normalized program structure. Still maintained by some flows; new code uses `programTemplates.state` instead.

### Schema
- `programPhases(id, programTemplateId fk, orderIndex, title, durationWeeks, createdAt)`
- `programPhaseDays(id, programPhaseId fk, weekday anvil_weekday, dayType anvil_day_type default 'workout', workoutTemplateId fk, orderIndex, createdAt)`

### RLS
- Owner of the parent template CRUD; shared via `templateShares`.

### Triggers
- `…_bump` triggers → `anvil_program_children_bump_trigger`.

### Last Updated
2026-05-03

---

## `clientProgramAssignments`

### Purpose
A program assigned to a client (one row per assignment).

### Columns
- `id`, `trainerid`, `clientid`, `programtemplateid`, `startdate`, `status text default 'active'`, `notes`, `createdat`, `updatedat`, `progress jsonb default '{"version":1, "lastCompletedAt":null, "completedDayKeys":[]}'::jsonb`.

### Indexes
- PK; unique on (`clientid`,`programtemplateid`,`startdate`); `idx_client_program_assignments_programtemplateid`; `idx_client_program_assignments_trainer_client_status`.

### RLS
- Participants SELECT (trainer or client).
- Trainer INSERT/UPDATE/DELETE on active link.
- Client UPDATE on own row (used to mark days complete via `mark_program_day_complete`).

### Last Updated
2026-05-03

---

## `clientWorkoutAssignments`

### Purpose
A workout assigned to a client for a specific date. May be standalone (`source='standalone'`) or generated from a program (`source='program'` + `programassignmentid` + `programdaykey`).

### Columns
- `id`, `trainerid`, `clientid`, `workoutid`, `scheduledfor date`, `status text default 'scheduled'`, `source text default 'standalone'`, `programassignmentid`, `programdaykey`, `createdat`, `updatedat`.

### Indexes
- PK; unique on (`clientid`,`workoutid`,`scheduledfor`,`source`); two partial unique indexes for manual vs program rows; `idx_client_workout_assignments_client_scheduledfor`; `idx_client_workout_assignments_trainer_client_scheduledfor`; `idx_client_workout_assignments_workoutid`; `idx_client_workout_assignments_programassignmentid`.

### RLS
- Participants SELECT.
- Trainer INSERT/UPDATE/DELETE on active link; client UPDATE allowed too (status, etc.).

### Notes
- The local migration `20260503165500_workout_assignment_schedule_time.sql` introduces a `scheduledtime time` column. **Not yet applied** to the live DB.

### Last Updated
2026-05-03

---

## `workoutSessions`

### Purpose
A run of a workout (resumable in_progress, then completed).

### Columns
- `id`, `clientid`, `trainerid` (nullable), `workouttemplateid`, `assignmentid` (nullable, FK `clientWorkoutAssignments`), `startedat default now()`, `finishedat`, `durationsec`, `status text default 'in_progress'`, `clientnotes`, `createdat`.

### Indexes
- PK; `idx_workout_sessions_assignmentid`; `idx_workout_sessions_client_status_startedat`; `workoutsessions_clientid_startedat_idx`; `workoutsessions_trainerid_startedat_idx`.

### RLS
- Participants SELECT/UPDATE; client INSERT (with assignment ownership check); trainer DELETE.

### Last Updated
2026-05-03

---

## `workoutSetLogs`

### Purpose
One row per (session, series, exercise, setIndex). Stores logged reps/weight/rpe and completion.

### Columns
- `id`, `sessionid`, `serieskey text`, `exercisekey text`, `setindex int`, `targetreps`, `actualreps`, `targetweightkg`, `actualweightkg`, `rpe`, `iscompleted bool default false`, `completedat`, `notes`, `createdat`.

### Indexes
- PK; unique on (`sessionid`,`serieskey`,`exercisekey`,`setindex`); `workoutsetlogs_sessionid_idx`; `idx_workout_set_logs_session_exercise_set`.

### RLS
- Session participants CRUD.

### Last Updated
2026-05-03

---

## `workoutStatsDaily`

### Purpose
Per-client per-day aggregate (sessions, duration, sets, reps, volume).

### Columns
- `id`, `clientid`, `day date`, `totalsessions`, `totaldurationsec`, `totalsets`, `totalreps`, `totalvolumekg`, `updatedat`.

### Indexes
- PK; unique on (`clientid`,`day`).

### RLS
- Owner-only CRUD (`auth.uid() = clientid`).

### Notes
- Currently written by the client app (post-finish). **Needs verification** whether a server-side trigger/cron should own this.

### Last Updated
2026-05-03
