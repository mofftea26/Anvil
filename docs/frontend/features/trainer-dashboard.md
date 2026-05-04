# Trainer Dashboard

## Status

Implemented.

## Purpose

Trainer's home tab. One-glance overview of:

- Today's scheduled sessions across clients (roster card).
- Active client count and **today's scheduled check-ins** count (`clientCheckIns` for current date).
- Clients who need an **active program** (entry to the dedicated list screen).
- Quick path to **add client**.

## User Flow

1. Trainer signs in → `app/index.tsx` routes to `/(trainer)/(tabs)/dashboard`.
2. Trainer can tap refresh in the header to reload clients, profile, assignment summary, and today's check-in count.
3. **Need a program** card → `/(trainer)/clients-without-program` (RPC `anvil_get_trainer_clients_without_active_program`).
4. **Check-ins today** card → `/(trainer)/check-ins`.
5. **Add client** button → `/(trainer)/add-client`.

## Main Files

- `features/dashboard/screens/TrainerDashboardScreen.tsx` — layout, hero, roster, stat chips, dashboard cards, add client.
- Route: `app/(trainer)/(tabs)/dashboard.tsx`.

## Components

- `StickyHeader` — title + subtitle + refresh.
- `TabBackgroundGradient` — brand gradient.
- `HeroCard` (local) — greeting, avatar, active + training today summary.
- `TodayRosterCard` (local) — today's training clients.
- `StatChip` (local) — two tiles: **Active** clients, **Check-ins today** (from `useTrainerTodayCheckInsCount`).
- `NoProgramCard` (local) — danger-styled card; badge = count without active program.
- `CheckInsCard` (local) — accent-styled card; shows today's check-in count + chevron.
- `Button` (full width) — Add client.

## Hooks

- `useMyProfile()` — trainer name/avatar in hero.
- `useTrainerClients()` — roster and refresh.
- `useTrainerClientsAssignmentsSummary()` — active programs, today's workouts, titles; drives `noProgramCount` and roster rows.
- `useTrainerTodayCheckInsCount(refreshToken)` — `anvil_get_trainer_checkins_by_date(today)` length; stays in sync on refresh and focus.

## State Management

- RTK Query + local summary refresh token.
- Local refreshing flag for header button.

## API / Supabase Dependencies

- `trainerClients`, assignments tables (summary hook), indirectly `clientCheckIns` via check-in count hook.

## Validation Rules

N/A.

## UI / UX Rules

- Fixed layout without vertical scroll; blocks fit the viewport.
- Tappable cards and buttons meet minimum touch targets.

## iOS + Android Notes

- Same as other dashboard surfaces; respect bottom tab inset.

## SOLID / Architecture Notes

- Presentational pieces are local to the screen file; consider extracting to `features/dashboard/components/trainer/` if the screen grows further.

## Performance Notes

- Check-in count is one RPC per refresh/focus; summary hook batches assignment reads.

## Known Issues

- `noProgramCount` on the dashboard is still derived from the assignment summary hook (local computation) while the **list** screen uses `anvil_get_trainer_clients_without_active_program()`; counts should match for active clients but **Needs verification** if edge cases diverge.

## Last Updated

2026-05-04 — Phase D: `NoProgramCard`, `CheckInsCard`, two stat chips, removed Clients/Library quick pills; today's check-ins stat + card; `useTrainerTodayCheckInsCount`.
