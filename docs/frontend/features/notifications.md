# Notifications

## Status

Not implemented yet.

There is no push notification setup, no `expo-notifications` integration, no in-app notifications center, and no DB schema for notification events.

## Expected Purpose

Drive timely engagement:

- **Trainer**: new client request, client finished a session, missed scheduled day, new message (when chat lands).
- **Client**: workout reminder for today, program day reminder, trainer accepted/declined link, trainer assigned a new program/workout.

## Expected Files

- `features/notifications/api/notifications.api.ts`
- `features/notifications/hooks/useNotificationsBootstrap.ts` — registers Expo push token, syncs to backend.
- `features/notifications/hooks/useNotificationsList.ts`
- `features/notifications/screens/NotificationsScreen.tsx`
- `features/notifications/components/NotificationCard.tsx`
- `app/(trainer)/notifications.tsx` and `app/(client)/notifications.tsx` (or a modal route)

## Expected Supabase Dependencies

- `expo-notifications` (or `expo-server-sdk` on the server side) for push.
- A new table:
  - `userNotifications`:
    - `id uuid pk`, `userId uuid fk users`, `type text` (enum), `title text`, `body text`, `payload jsonb`, `readAt timestamptz`, `createdAt timestamptz`.
- A new table for push token registrations:
  - `userPushTokens`:
    - `id uuid pk`, `userId uuid fk users`, `expoPushToken text unique`, `platform text`, `createdAt`, `lastSeenAt`.
- RLS:
  - Owner can SELECT/UPDATE their own rows; trigger/Edge Function inserts (service-role).
- Edge Functions:
  - `anvil-send-notification` (trigger from DB events / cron).
  - `anvil-register-push-token` (or use a regular RPC).
- Triggers (DB):
  - On `clientWorkoutAssignments` insert with future `scheduledFor` → schedule reminder.
  - On `trainerRequests` insert/update → notify other party.
  - On `workoutSessions` finish → notify trainer.

## Future Notes

- Decide between a pure server-side schedule (cron via `pg_cron` + Edge Function) or device-local notifications (`expo-notifications` schedule). For multi-device parity, prefer server-side; for offline reliability, prefer device-local. A hybrid is likely best.
- Push notifications require Apple developer push key (APNs) and an FCM server key (Android). Plan for EAS credentials.
- The notification badge/counter must be served as a single number from Supabase to avoid client divergence.
- Localize notification copy via `i18next` server-side templates if possible, or via the receiving client.
- Add an ADR before implementing: choice of push provider, retention policy, dedup strategy.

## Last Updated

2026-05-03 — initial placeholder generated.
