# Supabase Auth

## Overview

Auth is handled by Supabase Auth. The Anvil app uses:

- Email/password sign-in & sign-up.
- Magic-link sign-in (PKCE flow).
- Password recovery via deep link.
- Session persistence via React Native `AsyncStorage` (configured in `shared/supabase/client.ts`).

There is **no** OAuth (Google/Apple) yet, **no** MFA, and **no** SSO.

## Client wiring

`shared/supabase/client.ts`:

```ts
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});
```

- `processLock` ensures one renderer at a time touches the session (RN doesn't have a true `Window` for the default `BroadcastChannel` lock).
- `detectSessionInUrl: false` because we handle deep links manually via `Linking` in `useAuthBootstrap`.

## Bootstrap & deep links

`features/auth/hooks/useAuthBootstrap.ts`:

1. `supabase.auth.getSession()` to hydrate any persisted session.
2. `supabase.auth.onAuthStateChange((event, session) => …)` updates the Redux `auth` slice.
3. `Linking.addEventListener('url', …)` intercepts `anvil://` callbacks. If the URL contains a PKCE `code`, it calls `supabase.auth.exchangeCodeForSession(code)`.

## App ↔ DB user link

A row in `public.users` exists for every `auth.users` row. The link:

- `users.id = auth.users.id` (FK).
- `users.email`, `users.role`, `users.firstName`, `users.lastName`, `users.avatarUrl`, `users.roleConfirmed`.
- Trigger `handle_new_auth_user` (on `auth.users` insert) — **Needs verification** that this trigger is enabled. The function exists in `pg_proc`; confirm it is wired.

If a `users` row is missing for a brand-new auth user, the app's onboarding flow falls through and the user gets stuck on the onboarding profile screen. Tracked under tech debt: ensure the auth-trigger creates the `users` row reliably.

## Role assignment

- `users.role`: enum `user_role` (`trainer | client`). Default: `client`.
- `users.roleConfirmed`: boolean. Default: `false`.
- During onboarding (`/(onboarding)/role`), the app updates both fields in one mutation.
- Trigger `prevent_role_change_if_confirmed` blocks any subsequent `UPDATE … SET role = …` once `roleConfirmed = true`.
- Trigger `create_trainer_profile_on_role_change` (AFTER UPDATE on `users`) creates a `trainerProfiles` row when `role` becomes `trainer`. There is **no** equivalent for `clientProfiles` — **Needs verification** how `clientProfiles` rows are first created (likely by the client themselves on first profile edit).

## RLS uses

RLS policies use `auth.uid()` directly. No role check uses `auth.jwt()->>'role'` because Supabase Auth's `role` claim is the Postgres role (`authenticated`), not the app role. App-level role gating relies on `users.role`.

> **Never** read `auth.users.user_metadata` in RLS for authorization decisions — it is user-editable. Use `users.role` (server-controlled) instead.

## Token lifetime

Defaults from Supabase:

- Access token: 1 hour.
- Refresh token: rotates on every refresh; absolute lifetime configurable in Supabase dashboard.
- The client refreshes automatically when `autoRefreshToken: true`.

## Password reset flow

1. `requestPasswordReset(email)` → Supabase sends an email with a recovery link.
2. The link target is `anvil://reset-password` (must be added to Auth → URL Configuration).
3. The deep link is captured by `useAuthBootstrap`. Supabase emits an `onAuthStateChange` event with type `PASSWORD_RECOVERY`.
4. The app routes to `/(auth)/reset-password` where `ResetPasswordForm` collects the new password and calls `supabase.auth.updateUser({ password })`.

## Magic link flow

1. `requestMagicLink(email)` → Supabase sends a one-time link.
2. Link → `anvil://` (root) carries a PKCE `code`.
3. `useAuthBootstrap` exchanges the code for a session → `onAuthStateChange('SIGNED_IN')`.

## Hardening backlog

- Enable **leaked password protection** (HaveIBeenPwned check) in Supabase Auth settings — currently disabled (security advisor `auth_leaked_password_protection`).
- Decide on a min password policy (length, complexity).
- Add MFA (TOTP) at least for trainer accounts.
- Add OAuth (Apple required for iOS App Store if any social login is offered).

## Last Updated

2026-05-03 — initial documentation generated.
