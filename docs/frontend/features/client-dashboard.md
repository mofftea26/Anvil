# Client Dashboard

## Status

Implemented. The client dashboard shows a non-scrolling, role-prioritized snapshot for daily execution.

## Purpose

Client's home tab. Delivers:

- Today's workout (if any), with a primary "Start session" CTA.
- Active program progress (if assigned), opening the full program progress experience.
- Linked coach entry via a single branded card.
- Quick entry to Workouts sub-tabs (Schedule and My program) via deep link.

## User Flow

1. Client signs in → `/(client)/(tabs)/dashboard`.
2. Client can tap header refresh to re-fetch profile, coach, schedule, and program assignment data.
3. **Active program** card → `/(client)/program/[assignmentId]` (`ProgramProgressScreen`: info + calendar + day modal).
4. **Linked coach** card → `/(client)/(tabs)/coach`.
5. **Schedule** pill → `/(client)/(tabs)/workouts?tab=schedule`.
6. **Program** pill → `/(client)/(tabs)/workouts?tab=program`.

## Main Files

- `features/dashboard/screens/ClientDashboardScreen.tsx` — fixed-layout client dashboard (local presentation components + composition).
- Route: `app/(client)/(tabs)/dashboard.tsx`.

## Components

- `StickyHeader`, `TabBackgroundGradient` (shared).
- `HeroCard` (local) — branded gradient greeting + tagline.
- `TodayWorkoutCard` (local) — tall primary card (`minHeight` ~188px when training) with larger workout title, padded Start CTA, scheduled time pill, and program tag.
- `ActiveProgramProgressCard` (local) — tappable row: trophy icon, **program name and week on one horizontal line** (`weekOf` / `programWeekNumber`), progress % + chevron, then progress bar; opens `ProgramProgressScreen`. (Standalone program-week `StatChip` removed — week lives on this card.)
- `LinkedCoachCard` (`features/linking/components/client-coach/LinkedCoachCard.tsx`) — full-width coach/brand card; replaces the old coach StatChip + coach ActionPill.
- `ActionPill` (local) — vertical icon + label quick-action pill (Schedule + Program).

## Hooks

- `useMyProfile()` for first name shown in the greeting.
- `useClientWorkoutSchedule({ clientId })` for today's workout.
- `useClientProgramAssignments({ clientId })` for active-program detection and progress % derivation (local template walk + `completedDayKeys` until/unless dashboard adopts RPC detail).
- `useProgramTemplatesPublicMap()` for the active program template (title + duration + state).
- `useWorkoutTemplatesMap()` for today's workout title.
- `useClientCoach()` for linkage, brand colors, `logoUrl`, and first name (`LinkedCoachCard`).

## State Management

- RTK Query-backed feature hooks for profile/linking data.
- Local derivation for program progress percent (same as pre–Phase C; optional future: `useActiveProgramDetail` on dashboard for parity with server counts).
- Local `refreshing` state for header refresh button.

## API / Supabase Dependencies

- RPC `get_my_workout_schedule(p_from, p_to)`.
- RPC `get_my_program_assignments()`.
- Linking query for `get_my_coach` data.
- `users`, `clientProfiles`, `trainerProfiles` (via `useMyProfile`) for refresh parity.

## Validation Rules

N/A.

## UI / UX Rules

- No vertical scroll on dashboard content; all blocks fit the viewport.
- "Today" card is top-most and drives focus.
- Two `ActionPill`s (Schedule, Program) use equal flex; large touch targets.
- `LinkedCoachCard` uses the trainer `logoUrl` as cover when linked.

## iOS + Android Notes

- Bottom cards respect safe-area inset and tab bar spacing.
- Static cards avoid unnecessary animation and layout shifts.

## SOLID / Architecture Notes

- Presentational pieces for the dashboard live as local functions inside `ClientDashboardScreen.tsx` to keep the feature folder small; shared pieces (`LinkedCoachCard`) live under `features/linking/`.

## Performance Notes

- Today's workout query is small; schedule fetch uses a bounded window.
- `useMyProfile` is shared across the client surface — RTK Query cache makes the dashboard refresh cheap.

## Known Issues

- No analytics events for dashboard actions yet.

## Last Updated

2026-05-04 — Today’s workout card taller typography + `minHeight`; active program name + week on one line; removed duplicate program-week `StatChip`.
2026-05-04 — Phase C: removed week-done StatChip; active program card opens `ProgramProgressScreen`; `LinkedCoachCard`; workouts tab `?tab=` deep links for Schedule and Program.
