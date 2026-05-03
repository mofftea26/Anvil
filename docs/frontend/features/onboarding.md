# Onboarding

## Status

Implemented (minimal — name + role).

## Purpose

After a brand-new user signs up (or after their first authenticated load), collect the minimum information needed to enter the app:

1. First name + last name (required to populate `users.firstName/lastName`).
2. Role: `trainer` or `client` (locks `users.role` and sets `users.roleConfirmed = true`).

Once both are set, `app/index.tsx` redirects to the role-specific tabs.

## User Flow

1. Authenticated user with no `firstName/lastName` → `/(onboarding)/profile`.
2. User enters first + last name → `users` row updated → progresses.
3. User without `roleConfirmed` → `/(onboarding)/role`.
4. User picks **Trainer** or **Client** → `users.role` + `users.roleConfirmed=true` updated → DB trigger creates the matching `trainerProfiles` or `clientProfiles` row → user is redirected to the role's `(tabs)/dashboard`.
5. After confirmation, `users.role` cannot be changed (DB trigger `prevent_role_change_if_confirmed` blocks the update).

## Main Files

- `features/onboarding/screens/OnboardingProfileScreen.tsx`
- `features/onboarding/screens/OnboardingRoleScreen.tsx`
- Routes: `app/(onboarding)/profile.tsx`, `app/(onboarding)/role.tsx`
- Redirect logic: `app/index.tsx`

## Components

- `OnboardingProfileScreen` — controlled form with `firstName`, `lastName`. Calls `useUpdateProfile` (RTK Query) and shows toasts on save.
- `OnboardingRoleScreen` — two large cards ("I train people" / "I want to train"), one tap to commit.

## Hooks

- `useMyProfile()` (`features/profile/hooks/useMyProfile.ts`) — used to read current user; reused here for redirect logic.
- `useUpdateUserMutation` from `features/profile/api/profileApiSlice.ts` — used for both profile and role updates.

## State Management

- Reads: Redux `profile` slice (hydrated by `useMyProfile`).
- Writes: RTK Query `updateUser` mutation. Invalidates the `Profile` tag so the gating logic in `app/index.tsx` re-evaluates immediately.

## API / Supabase Dependencies

- Tables: `users` (update `firstName`, `lastName`, `role`, `roleConfirmed`).
- Triggers (server-side):
  - `trg_create_trainer_profile_on_role_change` → creates `trainerProfiles` row when `users.role` becomes `trainer`.
  - `trg_users_prevent_role_change_if_confirmed` → blocks updates that try to flip `role` when `roleConfirmed=true`.
  - `trg_users_updated_at` → bumps `updatedAt`.
- No RPCs or Edge Functions called.

## Validation Rules

- `firstName`: required, trimmed, min 1 char.
- `lastName`: required, trimmed, min 1 char.
- Role: must be one of `trainer | client` (enforced by the UI; the DB enum enforces it server-side).
- The first-name / last-name screen uses local zod validation. **Needs verification** for the exact schema location; current implementation uses inline checks in `OnboardingProfileScreen`.

## UI / UX Rules

- Dark theme; full-screen flow with no header.
- Big primary CTA at the bottom; disabled until inputs valid.
- Role screen uses two large `Card`s with icons (Hugeicons) and copy.
- Errors → toast.
- Avoid `<KeyboardAvoidingView>` directly — use `KeyboardScreen`.

## iOS + Android Notes

- Onboarding is the very first screen many users see — keep it touch-target friendly (44pt min).
- On Android: edge-to-edge means the bottom CTA must respect the safe-area inset.

## SOLID / Architecture Notes

- **SRP**: each screen handles one decision (name, then role).
- **DIP**: screens depend on `useMyProfile` + RTK Query mutation, not on `supabase` directly.

## Performance Notes

- Onboarding is one-shot; performance is not a concern.
- Don't preload trainer/client tab content here — wait until after the redirect.

## Known Issues

- No avatar upload step yet — would belong here.
- No language / units selection during onboarding (currently buried in profile editing).
- No back button policy: user cannot escape onboarding without completing both steps. **Needs verification** — confirm intentional and add UX copy if so.

## Last Updated

2026-05-03 — initial documentation generated.
