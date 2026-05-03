# Auth

## Status

Implemented.

## Purpose

Lets users sign up, sign in (email/password or magic link), reset their password, and sign out. Hydrates a Supabase session at app start, listens for auth state changes, and handles deep links from email-based flows (PKCE / magic link).

## User Flow

1. Cold start → `AuthBootstrap` (mounted in `app/_layout.tsx`) calls `useAuthBootstrap`. The hook:
   - sets `auth.status = 'loading'`,
   - calls `supabase.auth.getSession()`,
   - listens to `supabase.auth.onAuthStateChange`,
   - listens to `Linking` URL events to capture PKCE/magic-link callbacks (`exchangeCodeForSession`).
2. The route gate (`app/index.tsx`) reads `auth.status`:
   - `unauthenticated` → `/(auth)/sign-in`.
   - `authenticated` → see [onboarding](./onboarding.md) or role-based tabs.
3. From `/sign-in`, the user can:
   - sign in with email + password,
   - request a magic link (no password),
   - go to "Forgot password" or "Sign up".
4. On successful auth, `useAuthActions.signIn(...)` resolves and `useAuthBootstrap` updates the Redux state. The route gate redirects automatically.
5. `signOut` clears the session via `supabase.auth.signOut()`, the listener flips `auth.status = 'unauthenticated'`, and the gate redirects to `/sign-in`.

## Main Files

- `features/auth/components/AuthBootstrap.tsx` — invisible mount point for `useAuthBootstrap`.
- `features/auth/hooks/useAuthBootstrap.ts` — session hydration + URL handling.
- `features/auth/hooks/useAuthActions.ts` — memoized callbacks for sign-in/up/reset/sign-out, with toasts and friendly errors.
- `features/auth/store/authSlice.ts` — Redux slice (`status`, `userId`, `email`, `role`).
- `features/auth/api/authApiSlice.ts` — RTK Query endpoints injected into the shared `api`.
- `features/auth/types/auth.ts` — `UserRole`, `AuthState`.
- `features/auth/screens/SignInScreen.tsx`, `SignUpScreen.tsx`, `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx`.
- `features/auth/components/sign-in/*`, `sign-up/*`, `forgot-password/*`, `reset-password/*` — focused form components.
- `features/auth/hooks/sign-in/useSignInForm.ts`, `sign-up/useSignUpForm.ts`, `forgot-password/useForgotPasswordForm.ts`, `reset-password/useResetPasswordForm.ts` — `react-hook-form` + `zod` resolvers.
- Routes: `app/(auth)/sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`, `reset-password.tsx`.

## Components

- `SignInPasswordForm` — email + password form. Validates with zod, calls `useAuthActions.signIn`.
- `SignInMagicForm` — email-only form, calls `useAuthActions.requestMagicLink`.
- `SignInModeSwitch` — segmented control between password and magic-link modes.
- `SignUpForm` — email + password (+ confirm), calls `useAuthActions.signUp`.
- `ForgotPasswordForm` — email field, calls `useAuthActions.requestPasswordReset`.
- `CheckEmailView` — shown after a successful reset request.
- `ResetPasswordForm` — new password + confirm, calls `useAuthActions.updatePassword` after the recovery deep link is handled.

## Hooks

- `useAuthBootstrap()` — runs once at app start; hydrates session, handles deep links, syncs the slice.
- `useAuthActions()` — returns `{ signIn, signUp, requestMagicLink, requestPasswordReset, updatePassword, signOut }`. Each callback dispatches the corresponding RTK Query mutation, shows toasts on failure, and returns the unwrapped result.
- `useSignInForm`, `useSignUpForm`, `useForgotPasswordForm`, `useResetPasswordForm` — `react-hook-form` controllers with zod schemas.

## State Management

- Redux `auth` slice (`features/auth/store/authSlice.ts`):
  - `status`: `'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error'`.
  - `userId`, `email`, `role`, `error`.
- RTK Query (shared `api` in `shared/api/api.ts`) for the actual mutations. Tag `Auth` invalidates after sign-in/out.
- Tokens are persisted via Supabase's `AsyncStorage` adapter (configured in `shared/supabase/client.ts`). No tokens live in Redux.

## API / Supabase Dependencies

- Supabase Auth (email/password + magic link). PKCE deep links use the `anvil://` scheme.
- `users` table — read once after sign-in to fetch `role`, `firstName`, `lastName`. See [profile](./profile.md).
- No Edge Functions are involved in standard auth flows.

## Validation Rules

- Sign-in (`useSignInForm`):
  - `email`: required, valid email.
  - `password` (password mode): required, min 8 chars.
- Sign-up (`useSignUpForm`):
  - `email`: required, valid email.
  - `password`: min 8 chars, **Needs verification** for complexity (uppercase/symbol).
  - `confirmPassword`: must match `password`.
- Forgot password: `email` required.
- Reset password: `password` and `confirmPassword` (must match), min 8.

Errors are surfaced via `appToast.error(...)` with friendly messages. Network/validation errors are mapped from Supabase's `AuthError` shape.

## UI / UX Rules

- Dark theme. Cards on `theme.colors.background`.
- Inputs use the shared `Input` primitive (rounded, focus accent color).
- Buttons use `Button` with full-width `primary` variant for the main CTA, `ghost` for secondary actions.
- Loading: button shows `LoadingSpinner` and disables inputs.
- Errors: toast (no inline error block) — keeps screens compact.
- All text uses `useAppTranslation`.
- Keyboard: forms wrap content in `KeyboardScreen` so the focused field stays visible above the keyboard.
- The brand theme stays at the default trainer-less palette while in `(auth)`.

## iOS + Android Notes

- Deep link scheme `anvil://` for PKCE/magic link. Configure both the simulator and Supabase Auth → URL Configuration.
- iOS: tapping a magic link in Mail opens Safari → app. The app must be installed; no Universal Links fallback yet.
- Android: same flow via the system browser.
- Hardware back on Android during sign-in dismisses the keyboard first, then exits the screen — handled by Expo Router defaults.

## SOLID / Architecture Notes

- **SRP**: Each form has its own component + hook + zod schema; `useAuthBootstrap` only handles bootstrapping; `useAuthActions` only wraps mutations.
- **OCP**: Adding a new auth provider means adding a new endpoint to `authApiSlice.ts` and a new action to `useAuthActions` — no changes to consumers.
- **DIP**: Screens depend on `useAuthActions`, not on `supabase` directly.

## Performance Notes

- Auth is cold-path. `AuthBootstrap` mounts once.
- Form re-renders are scoped via `react-hook-form`'s controlled inputs.
- React Compiler memoizes form components automatically.
- Avoid logging sensitive fields.

## Known Issues

- Password complexity validation is **Needs verification** — confirm whether stricter rules are required by Supabase Auth settings.
- Supabase Auth "leaked password protection" (HaveIBeenPwned) is **not enabled**. Tracked in [`technical-debt.md`](../../decisions/technical-debt.md).
- No biometric / device-token unlock yet.
- No 2FA / MFA.

## Last Updated

2026-05-03 — initial documentation generated from a full repo + MCP inspection.
