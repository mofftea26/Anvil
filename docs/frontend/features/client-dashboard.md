# Client Dashboard

## Status

Partially implemented. Sticky header + pull-to-refresh exist; the body is empty. The "My Coach" panel intentionally lives in its own tab (`/(client)/(tabs)/coach.tsx`).

## Purpose

Client's home tab. Eventually:

- Today's workout (if any), with a primary "Start session" CTA.
- This week's schedule snapshot.
- Recent stats (last session, streak, weekly volume).
- Active program progress (if assigned).

## User Flow

1. Client signs in → `/(client)/(tabs)/dashboard`.
2. Pull-to-refresh re-runs `useMyProfile.refetch()` (currently the only data source).
3. (Planned) tapping today's workout card → `/(client)/workouts/run/[assignmentId]`.

## Main Files

- `features/dashboard/screens/ClientDashboardScreen.tsx` — current placeholder.
- Route: `app/(client)/(tabs)/dashboard.tsx`.

## Components

- `StickyHeader`, `TabBackgroundGradient` (shared).
- (Planned) `TodayWorkoutCard`, `WeekScheduleStrip`, `WeekVolumeMiniBars`, `ProgramProgressCard`.

## Hooks

- `useMyProfile()` — currently used so refresh re-loads profile.
- (Planned) `useClientWorkoutSchedule({ from, to })` (already exists).
- (Planned) `useClientProgramAssignments()` (already exists).
- (Planned) `useWorkoutStatsWeekly()` — derived from `workoutStatsDaily`.

## State Management

- RTK Query slices for shared data.
- Local `refreshing` state only.

## API / Supabase Dependencies

- (Planned) RPC `get_my_workout_schedule(p_from, p_to)`.
- (Planned) RPC `get_my_program_assignments()`.
- (Planned) Direct read from `workoutStatsDaily` (`auth.uid() = clientid`).
- `users`, `clientProfiles`, `trainerProfiles` (via `useMyProfile`) for greeting + brand theming.

## Validation Rules

N/A.

## UI / UX Rules

- "Today" card top-most, with brand-accented CTA.
- Empty state: gentle copy + link to "Find trainer" if unlinked.
- Use `expo-haptics` lightly (`Haptics.selectionAsync`) when starting a session.

## iOS + Android Notes

- Edge-to-edge aware: bottom CTA must respect tab bar inset.
- Don't autoplay any animation on focus — keep it on first mount only.

## SOLID / Architecture Notes

- Cards in `features/dashboard/components/client/`; screen is composition-only.
- Data hooks in `features/dashboard/hooks/client/` to keep cards pure.

## Performance Notes

- Today's workout query is small; the week schedule is slightly larger — pass narrow `p_from/p_to` to the RPC.
- `useMyProfile` is shared across the client surface — RTK Query cache makes the dashboard refresh free.

## Known Issues

- Empty body.
- No analytics events for "session started from dashboard".

## Last Updated

2026-05-03 — initial documentation generated.
