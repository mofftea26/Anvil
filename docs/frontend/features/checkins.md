# Check-ins (Trainer)

## Status

Implemented.

## Purpose

Trainer-facing **scheduled check-in slots** on a day-based timeline: create, edit, delete, and drag to reschedule. Data lives in `clientCheckIns` and is accessed via dedicated RPCs (not direct table writes from the app for mutations).

Distinct from the legacy **“mark check-in”** pill on the client details screen (`anvil_mark_client_checkin` → `trainerClientManagement.lastCheckInAt`); that flow remains for quick cadence updates. The timeline is the structured scheduling surface.

## User Flow

1. Trainer opens **Check-ins** from the trainer dashboard card or `/(trainer)/check-ins`.
2. Horizontal day pills + month/year picker match the shared `TimelineBoard` pattern (same as the client schedule tab).
3. **Drag** a card vertically to change its time; the hook recomputes `sortOrder` for all rows that day and calls `anvil_reorder_client_checkin` for each.
4. **Tap** a card → modal to edit status, notes, metrics summary, and time. **FAB** adds a check-in for the selected day (client picker via `useTrainerClientsOptions`).
5. Delete from the edit modal (confirm).

## Main Files

- `features/checkins/screens/TrainerCheckInsTimelineScreen.tsx`
- `features/checkins/components/CheckInModal.tsx`
- `features/checkins/components/CheckInTimelineItem.tsx`
- `features/checkins/hooks/useTrainerCheckIns.ts`
- `features/checkins/hooks/useTrainerTodayCheckInsCount.ts` — today’s row count for the dashboard card.
- `features/checkins/api/checkins.api.ts`
- `features/checkins/types.ts`
- Route: `app/(trainer)/check-ins.tsx`

## Components

- `CheckInModal` — create/edit sheet (client picker, time, status, notes, metrics).
- `CheckInTimelineItem` — `renderItemContent` for `TimelineBoard` (avatar, name, notes snippet, status pill).

## Hooks

- `useTrainerCheckIns()` — month cursor, selected day, loads month date hints via `clientCheckIns` SELECT and day rows via `anvil_get_trainer_checkins_by_date`, drag reorder + save/delete helpers.
- `useTrainerTodayCheckInsCount(refreshToken)` — count for dashboard; refetches on focus and when `refreshToken` changes.

## State Management

- Local hook state + Supabase RPC / selective `.from("clientCheckIns")` read for month dots.
- No RTK Query slice yet; follow-up could tag-invalidate if other screens edit the same rows.

## API / Supabase Dependencies

- Table: `clientCheckIns` (read for date keys in range; trainer RLS).
- RPCs:
  - `anvil_get_trainer_checkins_by_date(p_date)`
  - `anvil_upsert_client_checkin(...)`
  - `anvil_reorder_client_checkin(...)`
  - `anvil_delete_client_checkin(p_id)`

## Validation Rules

- Status ∈ `scheduled|completed|missed|cancelled` (DB check + RPC validation).
- Client must be linked (`_require_trainer_link` on upsert).

## UI / UX Rules

- Reuse `TimelineBoard` `bottomHintText` for drag/tap instructions.
- Minimum touch targets on FAB and cards; `StickyHeader` back + refresh.

## iOS + Android Notes

- Same as `TimelineBoard`: `DateTimePicker` platform differences inside the modal.

## SOLID / Architecture Notes

- All Supabase calls in `checkins.api.ts`; screen composes hook + shared UI.
- `TrainerCheckInsTimelineScreen` stays under ~250 LOC by keeping modal/item in separate files.

## Performance Notes

- One range query per month for dots; one RPC per selected day. Reorder issues N RPCs for N rows that day (typically small).

## Known Issues

- **Needs verification:** PostgREST column names for `clientCheckIns` in `.from()` must match quoted identifiers (`trainerId`, `scheduledFor`).

## Last Updated

2026-05-04 — Phase D: trainer check-ins timeline screen, API, hooks, routes, i18n, docs.
