# Clients (Trainer side)

## Status

Implemented.

## Purpose

Lets a trainer see and manage their roster of clients: list active/archived clients, view a client's details and brand info, manage check-in cadence and notes, archive a client, and from the same surface assign workouts/programs.

For client-side trainer linking ("Find my coach", redeem invite, request a trainer), see [`linking.md`](./linking.md). For program/workout assignment mechanics see [`programs.md`](./programs.md) and [`workouts.md`](./workouts.md).

## User Flow

1. Trainer taps **Clients** tab → list of `trainerClients` rows where `auth.uid() = trainerId` and `status='active'` (with archived shown lower / behind a toggle).
2. Each card shows the client's name + avatar, today's scheduled workout (if any), the active program title (if any), and quick actions:
   - **View** → `/(trainer)/client/[clientId]` (full details).
   - **Assign** → opens `AssignToClientsSheet` (workout or program).
   - **Archive** → soft-archives the link (keeps history visible).
3. The "+" header button opens `/(trainer)/add-client` ([linking](./linking.md)).
4. Inside the details screen the trainer can:
   - Edit `clientStatus` (`active`/`paused`/`inactive`), check-in frequency, next check-in.
   - View basic client info (`firstName`, `lastName`, `email`, `phone`).
   - Manage assigned workouts/programs (the assignments components live under `features/clients/components/assignments/`).
   - Mark a check-in (`anvil_mark_client_checkin`).

## Main Files

- Screens
  - `features/clients/screens/TrainerClientsScreen.tsx`
  - `features/clients/screens/TrainerClientDetailsScreen.tsx`
- Hooks
  - `features/clients/hooks/trainer-clients/useTrainerClients.ts`
  - `features/clients/hooks/trainer-client-details/useTrainerClientDetails.ts`
  - `features/clients/hooks/assignments/useTrainerClientsAssignmentsSummary.ts`
  - `features/clients/hooks/assignments/useClientAssignmentsOverview.ts`
  - `features/clients/hooks/assignments/useProgramAssignmentStats.ts`
  - `features/clients/hooks/assignments/useProgramTemplatesMap.ts`
  - `features/clients/hooks/assignments/useTrainerClientsOptions.ts`
- Components
  - `features/clients/components/trainer-clients/TrainerClientCard.tsx`
  - `features/clients/components/trainer-client-details/*` (HeroCard, BasicInfoCard, ManagementCard, LinkActionsCard)
  - `features/clients/components/assignments/*` (AssignToClientsSheet, AssignTypeSheet, ChooseProgramTemplateSheet, ChooseWorkoutTemplateSheet, ClientAssignedItemsCard, ManageAssignmentSheet, ProgramAssignmentDuplicateModal, TrainerClientScheduleTab)
- API
  - `features/clients/api/assignments.api.ts` (workout/program assignment functions)
- Types & utils
  - `features/clients/types/assignments.ts`
  - `features/clients/utils/clientUi.ts`
- Routes
  - `app/(trainer)/(tabs)/clients.tsx`
  - `app/(trainer)/client/[clientId].tsx`

## Components

- `TrainerClientCard` — one row per client. Shows avatar, name, status badges, today's workout, active program. Buttons: View, Archive, Assign.
- `ClientDetailsHeroCard` — large header with avatar + name + status pills.
- `ClientDetailsBasicInfoCard` — email/phone/etc.
- `ClientDetailsManagementCard` — `clientStatus`, check-in frequency, next/last check-in.
- `ClientDetailsLinkActionsCard` — archive / unarchive / delete archived link.
- `AssignToClientsSheet` — trainer picks which clients to assign to.
- `AssignTypeSheet` — pick workout vs program assignment.
- `ChooseProgramTemplateSheet`, `ChooseWorkoutTemplateSheet` — template picker.
- `ClientAssignedItemsCard` — list of programs/workouts assigned to the client.
- `ManageAssignmentSheet` — edit/cancel an assignment (date, archive, etc.).
- `ProgramAssignmentDuplicateModal` — confirm overwriting an existing program assignment.
- `TrainerClientScheduleTab` — shows the client's upcoming schedule (workouts in the coming days).

## Hooks

- `useTrainerClients()` — wraps `getTrainerClients` query (RTK Query). Returns rows, loading state, refresh control, and `onArchive`.
- `useTrainerClientDetails(clientId)` — composes the user, profile, management row, and link metadata for one client.
- `useTrainerClientsAssignmentsSummary({ trainerId, clientIds, refreshToken })` — batches reads for active programs & today's workouts across many clients without N+1.
- `useClientAssignmentsOverview(clientId)` — used in the details screen.
- `useTrainerClientsOptions()` — formats the list of clients for picker sheets.

## State Management

- All shared data via RTK Query (`linking` slice for `trainerClients`/`trainerClientManagement`, plus the assignments helpers in `clients/hooks/assignments/*`).
- Local UI state for sheet visibility and form drafts.
- Sticky header refresh tokens force assignments badges to refetch when returning from sub-screens (`useFocusEffect`).

## API / Supabase Dependencies

- Tables: `trainerClients`, `trainerClientManagement`, `users`, `clientProfiles`, `clientProgramAssignments`, `clientWorkoutAssignments`, `programTemplates`, `workouts`.
- RPCs:
  - `anvil_set_trainer_client_status(p_client_id, p_status)` — change link status (active/archived).
  - `anvil_upsert_trainer_client_management(p_client_id, p_client_status, p_coach_notes, p_tags, p_check_in_frequency, p_next_check_in_at)` — manage row.
  - `anvil_mark_client_checkin(p_client_id, p_next_check_in_at)`.
  - `anvil_delete_archived_client_link(p_client_id)`.
  - `assign_client_workout`, `assign_client_workout_template`, `assign_client_workout_bulk`, `assign_client_workout_template_bulk`.
  - `anvil_assign_program_to_client(p_client_id, p_program_template_id, p_start_date, p_notes)`.
  - `update_workout_assignment_date`, `archive_client_workout_assignment`, `reactivate_client_workout_assignment`, `unassign_workout_from_client`.
  - `update_program_assignment_start_date`, `archive_client_program_assignment`, `reactivate_client_program_assignment`, `unassign_program_from_client`.
- All RLS-protected; all RPCs are `SECURITY DEFINER` and validate the trainer↔client link via the `_require_trainer_link` helper.

## Validation Rules

- `clientId` must be a UUID; `trainerClients.status` must be `'active'` for assignment writes (DB enforces).
- Tags are free text; check-in frequency is a `checkin_frequency` enum (`weekly|biweekly|monthly|custom`).
- `nextCheckInAt` must be in the future when changed (UI enforced; **Needs verification** whether DB enforces).

## UI / UX Rules

- Cards use the shared `Card` primitive on `theme.colors.background`.
- Assignment sheets use `BottomSheetPicker` style (rounded top, drag handle, blurred backdrop).
- Confirmations (archive/delete) go through `useAppAlert` — never raw `Alert.alert`.
- Empty list shows a single big "Add client" CTA.
- Loading: skeletons in cards (planned), `LoadingSpinner` in lists.

## iOS + Android Notes

- Bottom sheets need `react-native-gesture-handler` root wrapping (already in place at `_layout.tsx`).
- Android: use `removeClippedSubviews` for very long client lists.
- Avatar fallbacks: use `expo-image` with a placeholder color matching the client's brand accent.

## SOLID / Architecture Notes

- **SRP**: list, detail card, management card, assignment sheets, and badges live in separate files.
- **DIP**: screens depend on hooks; hooks depend on `assignments.api.ts` or RTK Query slices.
- **OCP**: new bulk action = new RPC + new method in `assignments.api.ts` + a button in `AssignToClientActions.tsx`.

## Performance Notes

- `useTrainerClientsAssignmentsSummary` batches multiple `select … in (clientIds)` calls instead of one per row.
- The list uses `ScrollView` because client rosters are typically small. Switch to `FlatList` if a trainer can plausibly have >50 active clients (record this in an ADR).
- Use stable keys (`row.id`) — already done.

## Known Issues

- Skeleton loading is missing — currently a single spinner.
- The screen uses a `ScrollView` not a virtualized list. Acceptable for now; not for >50 rows.
- `archiveLoading` is a single boolean — clicking Archive on one row dims all rows. Consider keying by id.
- Some assignment helpers do client-side joining; if the dataset grows, prefer DB views.

## Last Updated

2026-05-03 — initial documentation generated.
