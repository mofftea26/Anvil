# Schema Overview

> Detailed per-table reference is in [`tables.md`](./tables.md). FK map and cardinality in [`relationships.md`](./relationships.md). This file is the **mental model**.

## Domains

The schema groups into five domains:

```
              ┌────────────┐
              │   users    │  (1:1 with auth.users; role = trainer | client)
              └─────┬──────┘
                    │
   ┌────────────────┼─────────────────────────────────────────────┐
   │ Profiles      │ Linking                                       │ Workouts                                         │ Programs                                                   │ Audit
   │ • clientProfiles    • trainerClients (link)                    │ • workouts (template root)                       │ • programTemplates                                         │ • assetEditHistory
   │ • trainerProfiles   • trainerClientManagement                  │ • workoutSeriesBlocks                            │ • programPhases (legacy)                                   │
   │                     • trainerInvites                           │ • workoutSeriesExercises                          │ • programPhaseDays (legacy)                                │
   │                     • trainerRequests                          │ • workoutSetPrescriptions                         │ • clientProgramAssignments (per client)                    │
   │                     • setTypes                                 │ • clientWorkoutAssignments (per client per day)   │   └─generates→ clientWorkoutAssignments                    │
   │                     • templateShares                           │ • workoutSessions                                 │                                                            │
   │                     • exercises                                │ • workoutSetLogs                                  │                                                            │
   │                                                                │ • workoutStatsDaily                               │                                                            │
   └────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘
```

## Two competing program models

`programTemplates` carries a `state` JSONB column with the entire program structure (phases → weeks → weekdays → workout refs). This is the **canonical** model used by new code.

The older normalized tables `programPhases` + `programPhaseDays` still exist with FKs and triggers. They are gradually being replaced by `state`. Decide on one model and migrate (tracked in tech debt).

## Canonical contracts (assignments, sessions, set logs)

These contracts live with the JSONB-canonical model and are the source of truth for new writers. (Folded in from the former `supabase/ARCHITECTURE_NOTES.md`.)

- **`clientProgramAssignments`**
  - Contract fields: `trainerid`, `clientid`, `programtemplateid`, `startdate`, `status`, `progress`.
  - `progress` is JSONB with versioned shape: `{ version, completedDayKeys, lastCompletedAt }`.
- **`clientWorkoutAssignments`**
  - Canonical workout pointer is `workoutid` (FK → `workouts.id`).
  - Program-generated rows set `source = 'program'` and carry `programassignmentid` + `programdaykey`.
  - Optional `scheduledtime` column documented in tech debt (migration unapplied to live DB).
- **`workoutSessions`**
  - Canonical columns are snake-case-without-separator: `clientid`, `trainerid`, `assignmentid`, `workouttemplateid`, `startedat`, `finishedat`, `durationsec`, `status`.
- **`workoutSetLogs`**
  - Canonical uniqueness key: `(sessionid, serieskey, exercisekey, setindex)`.
  - Runtime values: `actualreps`, `actualweightkg`, `iscompleted`. The `serieskey` / `exercisekey` semantics are documented in tech debt — runner is expected to use `series.id` and `exercise.id`.

## RLS spine

Trainer/client link (`trainerClients`) is the authorization spine for assignment, session, and log data.

Sensitive runtime tables that **must** stay RLS-enabled with explicit policies:

- `clientProgramAssignments`
- `clientWorkoutAssignments`
- `workoutSessions`
- `workoutSetLogs`
- `workoutStatsDaily`

Series / prescription tables are readable when the user owns the workout or is assigned that workout via `clientWorkoutAssignments`.

## Storage spine

`avatars` and `logos` buckets:

- Read: authenticated users (under broad SELECT policies — see tech-debt around public-bucket listing).
- Insert / Update / Delete: only authenticated user under their own folder prefix (`{auth.uid()}/...`).

`pdfs` is private (not listed publicly).

## Entity reference

Click each table name for the full doc in [`tables.md`](./tables.md).

| Table | Purpose | Owner / scope |
| --- | --- | --- |
| `users` | App-level user row, mirrors `auth.users` | Self |
| `clientProfiles` | Client-only profile (body metrics, prefs) | Self + linked trainer (read) |
| `trainerProfiles` | Trainer-only brand & bio | Self + linked clients (read) |
| `trainerClients` | The link between a trainer and a client | Either side (read) |
| `trainerClientManagement` | Trainer-side notes, check-in cadence, status | Either side (read), trainer (write) |
| `trainerInvites` | Invite codes a trainer issues | Trainer (read/write) |
| `trainerRequests` | Requests a client sends to a trainer email | Both sides depending on resolution |
| `templateShares` | Cross-trainer sharing of exercises/workouts/programs | Sharer + recipient |
| `assetEditHistory` | Append-only audit of edits to shared assets | Actor trainer |
| `setTypes` | Dictionary of set types (warmup, drop, working, …) | Read by all `authenticated` |
| `exercises` | Library of exercises | Stock + owner + shared |
| `workouts` | Workout template root (carries `state` JSONB) | Trainer (owner) |
| `workoutSeriesBlocks` / `workoutSeriesExercises` / `workoutSetPrescriptions` | Normalized workout structure (legacy / parallel with `state`) | Trainer (owner) |
| `programTemplates` | Program template root (carries `state` JSONB) | Trainer (owner) + share |
| `programPhases` / `programPhaseDays` | Normalized program structure (legacy) | Trainer (owner) |
| `clientProgramAssignments` | A program assigned to a client | Trainer + client |
| `clientWorkoutAssignments` | A workout assigned to a client for a date | Trainer + client |
| `workoutSessions` | A run of a workout (in_progress / completed) | Client + trainer |
| `workoutSetLogs` | Per-set log inside a session | Session participants |
| `workoutStatsDaily` | Per-client per-day aggregate (volume, sessions, etc.) | Client |
| `clientCheckIns` | Per-day trainer-scheduled check-in slots (drag/drop timeline) | Trainer (write) + client (read) |

## Enums

| Enum | Values |
| --- | --- |
| `user_role` | `trainer`, `client` |
| `unit_system` | `metric`, `imperial` |
| `gender_type` | `male`, `female`, `other` |
| `link_status` | `active`, `archived` |
| `invite_status` | `pending`, `redeemed`, `expired`, `revoked` |
| `request_status` | `pending`, `accepted`, `declined`, `cancelled` |
| `client_status` | `active`, `paused`, `inactive` |
| `client_relationship_status` | `active`, `paused`, `cancelled` |
| `checkin_frequency` | `weekly`, `biweekly`, `monthly`, `custom` |
| `anvil_template_status` | `draft`, `published`, `archived` |
| `anvil_program_difficulty` | `beginner`, `intermediate`, `advanced` |
| `anvil_weekday` | `monday` … `sunday` |
| `anvil_day_type` | `workout`, `rest` |
| `anvil_series_block_type` | `straight`, `superset`, `triset`, `giantset`, `circuit` |
| `anvil_share_permission` | `view`, `edit` |
| `anvil_asset_type` | `exercise`, `workout`, `program` |
| `exercise_target_muscle` | 43 values (chest, back, arms, legs, core, etc.) |
| `exercise_equipment` | 15 values (`bodyweight`, `dumbbell`, `barbell`, …) |

## Extensions installed

- `pgcrypto` 1.3 (`gen_random_uuid()`).
- `uuid-ossp` 1.1.
- `pg_stat_statements` 1.11.
- `supabase_vault` 0.3.1.
- `pg_graphql` 1.5.11.
- `plpgsql` 1.0.

Notable extensions **not** installed: `pg_cron`, `pg_net`, `vector`, `http`. Document any new install in `decisions/architecture-decisions.md` as an ADR.

## Last Updated

2026-05-04 — added `clientCheckIns` (Phase A overhaul).
