# Settings

## Status

Not implemented yet (as a discrete screen).

The pieces that would normally live in a Settings screen are scattered today: language switch + sign-out are inside `ProfileAccountCard` on the profile screen; theme is dark-only; notifications and units (for clients) are partially in profile preferences.

## Expected Purpose

Centralize app-level settings:

- Language (en/fr/ar) with RTL handling.
- Notifications opt-in/out (when notifications feature lands).
- Privacy / data export / account deletion.
- Help & feedback.
- App version + build number.
- Sign out (move from `ProfileAccountCard`).

## Expected Files

- `app/(client)/settings.tsx` and `app/(trainer)/settings.tsx` (or a single `app/settings.tsx` reachable from both profile screens).
- `features/settings/screens/SettingsScreen.tsx`.
- `features/settings/components/LanguageRow.tsx`, `NotificationsRow.tsx`, `AccountRow.tsx`, `LegalRow.tsx`, `AppInfoRow.tsx`.
- `features/settings/hooks/useSettings.ts` (composes language, notifications, account actions).

## Expected Supabase Dependencies

- `users` (for account deletion / data export endpoints — likely via Edge Function with service-role).
- A future `notificationsPreferences` table (or column on `users`) — TBD.
- Edge Function `anvil-delete-account` (not yet built) — must validate JWT and revoke linked rows safely (cascade-aware).

## Future Notes

- Language selection: today the profile card has a basic switch. Move it to settings, persist in `AsyncStorage`, and re-render via i18next.
- RTL: `applyRtlIfNeeded(lang)` exists in `shared/i18n/rtl.ts`. On Android, switching to/from `ar` may require an app restart — show a confirmation modal explaining this.
- Notifications: requires picking a provider (Expo Push? Supabase realtime?). Document the choice in an ADR before building.
- Account deletion is a privacy/legal requirement in some jurisdictions — plan for it before App Store submission.

## Last Updated

2026-05-03 — initial placeholder generated.
