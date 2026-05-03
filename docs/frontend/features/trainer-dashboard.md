# Trainer Dashboard

## Status

Partially implemented. The screen is mounted as the trainer's first tab, but the body is currently a placeholder (only the sticky header + pull-to-refresh).

## Purpose

Trainer's home tab. Eventually a one-glance overview of:

- Today's scheduled sessions across clients.
- Pending trainer requests / inbox.
- Active clients and their adherence.
- Quick links to the library and "Add client".
- Last 7 days of training volume across the trainer's clients.

## User Flow

1. Trainer signs in → app/index.tsx routes to `/(trainer)/(tabs)/dashboard`.
2. Pull-to-refresh re-fetches whatever data the dashboard cards depend on (placeholder for now).
3. Tapping a card / row navigates to the relevant screen (clients, library, add-client, etc.).

## Main Files

- `features/dashboard/screens/TrainerDashboardScreen.tsx` — current placeholder.
- Route: `app/(trainer)/(tabs)/dashboard.tsx`.

## Components

- `StickyHeader` — title + subtitle.
- `TabBackgroundGradient` — radial gradient using brand colors (provided by `ThemeProvider`).
- (Planned) cards: `TodayScheduleCard`, `RequestsInboxCard`, `RecentClientsCard`, `QuickActionsCard`.

## Hooks

- (Planned) `useTrainerDashboardData()` — composes:
  - `useGetTrainerRequestsInboxQuery`,
  - `useTrainerClients()`,
  - `useGetTrainerClientsAssignmentsSummary()` (already exists),
  - workout-session aggregates per client.

## State Management

- All shared data via RTK Query slices (`linking`, `assignments.api`).
- Local state only for `refreshing`.

## API / Supabase Dependencies

- (Planned) `get_trainer_requests_inbox(p_trainer_email text)` — RPC.
- (Planned) `clientWorkoutAssignments`, `workoutSessions`, `workoutStatsDaily` for adherence.
- `trainerClients` for client roster.

## Validation Rules

N/A.

## UI / UX Rules

- Cards on `theme.colors.background` with subtle inner backgrounds.
- Tappable cards must hit min 44pt.
- Empty state per card: short copy + a primary action.
- Pull-to-refresh tint = `theme.colors.text`.

## iOS + Android Notes

- `TabBackgroundGradient` uses `expo-linear-gradient` — performant on both platforms.
- Respect bottom-tab inset when adding the last card.

## SOLID / Architecture Notes

- Each card lives in its own file under `features/dashboard/components/trainer/`. The screen is composition-only.
- Data hooks live in `features/dashboard/hooks/` so cards stay presentational.

## Performance Notes

- Don't hammer Supabase on every focus — rely on RTK Query caching and optional `keepUnusedDataFor: 0` for true inboxes.
- Use `useMemo` for derived counts only when the source array is large.

## Known Issues

- Body is empty — primary feature surface is unfinished.
- No analytics/event hooks.

## Last Updated

2026-05-03 — initial documentation generated.
