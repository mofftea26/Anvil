# Relationships

Foreign-key relationships between public tables. `?` marks nullable FKs (one side may be missing).

```
auth.users
  └─1:1─ users
            │
            ├─1:1─ clientProfiles (userId → users.id)
            ├─1:1─ trainerProfiles (userId → users.id)
            │
            ├─1:N─ trainerClients (trainerId|clientId → users.id)
            │         └─1:1─ trainerClientManagement (trainerId,clientId → users.id × 2; created via trigger anvil_ensure_management_row)
            │
            ├─1:N─ trainerInvites (trainerId → users.id; redeemedBy? → users.id)
            ├─1:N─ trainerRequests (clientId → users.id; trainerEmail is text, not FK)
            │
            ├─1:N─ exercises (ownerTrainerId? → users.id; createdByTrainerId?, lastEditedByTrainerId? — not FKs in the live DB; **Needs verification**)
            ├─1:N─ workouts (trainerId → auth.users.id directly per pg_constraint; **Needs verification**)
            ├─1:N─ programTemplates (ownerTrainerId? → users.id — **Needs verification**)
            │
            ├─1:N─ clientProgramAssignments (trainerid → users.id, clientid → users.id, programtemplateid → programTemplates.id)
            │         └─1:N─ clientWorkoutAssignments (programassignmentid? → clientProgramAssignments.id)
            │
            ├─1:N─ clientWorkoutAssignments (trainerid → users.id, clientid → users.id, workoutid → workouts.id)
            │         └─1:N─ workoutSessions (assignmentid? → clientWorkoutAssignments.id)
            │
            ├─1:N─ workoutSessions (clientid → users.id; trainerid? → users.id; workouttemplateid → workouts.id)
            │         └─1:N─ workoutSetLogs (sessionid → workoutSessions.id)
            │
            └─1:N─ workoutStatsDaily (clientid is logical FK; not a hard FK in the live DB — **Needs verification**)
```

## FK details (verified via `information_schema.table_constraints`)

| Child table.column | Parent table.column |
| --- | --- |
| `clientProfiles.userId` | `users.id` |
| `clientProgramAssignments.clientid` | `users.id` |
| `clientProgramAssignments.trainerid` | `users.id` |
| `clientProgramAssignments.programtemplateid` | `programTemplates.id` |
| `clientWorkoutAssignments.clientid` | `users.id` |
| `clientWorkoutAssignments.trainerid` | `users.id` |
| `clientWorkoutAssignments.workoutid` | `workouts.id` |
| `clientWorkoutAssignments.programassignmentid` | `clientProgramAssignments.id` |
| `programPhases.programTemplateId` | `programTemplates.id` |
| `programPhaseDays.programPhaseId` | `programPhases.id` |
| `trainerClientManagement.clientId` | `users.id` |
| `trainerClientManagement.trainerId` | `users.id` |
| `trainerClients.clientId` | `users.id` |
| `trainerClients.trainerId` | `users.id` |
| `trainerInvites.trainerId` | `users.id` |
| `trainerInvites.redeemedBy` | `users.id` |
| `trainerProfiles.userId` | `users.id` |
| `trainerRequests.clientId` | `users.id` |
| `users.id` | `auth.users.id` (constraint name `users_id_fkey`) |
| `workoutSeriesExercises.exerciseId` | `exercises.id` |
| `workoutSeriesExercises.seriesBlockId` | `workoutSeriesBlocks.id` |
| `workoutSessions.assignmentid` | `clientWorkoutAssignments.id` |
| `workoutSessions.clientid` | `users.id` |
| `workoutSessions.trainerid` | `users.id` |
| `workoutSetLogs.sessionid` | `workoutSessions.id` |
| `workoutSetPrescriptions.seriesExerciseId` | `workoutSeriesExercises.id` |
| `workoutSetPrescriptions.setTypeId` | `setTypes.id` |
| `workouts.trainerId` | `auth.users.id` (per `information_schema.constraint_column_usage`; the parent is `auth.users`, not the public `users`) |

## Cardinality summary

- **users : trainerClients = 1 : N** (a user can be on either side of many links).
- **trainerClients : trainerClientManagement = 1 : 1** (enforced by unique pair index + trigger).
- **programTemplates : clientProgramAssignments = 1 : N**.
- **clientProgramAssignments : clientWorkoutAssignments = 1 : N** (program-generated workout days).
- **workouts : clientWorkoutAssignments = 1 : N**.
- **clientWorkoutAssignments : workoutSessions = 1 : N** (a session is created per run; usually 1, but a client could re-attempt).
- **workoutSessions : workoutSetLogs = 1 : N**.
- **workouts : workoutSeriesBlocks = 1 : N** (legacy normalized model).
- **workoutSeriesBlocks : workoutSeriesExercises = 1 : N** (legacy).
- **workoutSeriesExercises : workoutSetPrescriptions = 1 : N** (legacy).
- **users : workoutStatsDaily = 1 : N** (one row per client per day; uniqueness enforced).

## Cascade behavior

The cascade rules on each FK were not enumerated here — when adding migrations, default to `ON DELETE NO ACTION` and rely on RPCs (`unassign_*`, `archive_*`) to remove related rows in the right order. **Needs verification** for any explicit `ON DELETE CASCADE` rules currently in place.

## Last Updated

2026-05-03 — initial documentation generated.
