# Frontend Architecture

The Anvil frontend follows a **feature-based** layout with a thin **route layer** (Expo Router) and a shared **infrastructure layer** (`shared/`, `store/`).

---

## Layered model

```
┌────────────────────────────────────────────────────────────────┐
│ Routes (app/…)                                                 │
│   - Thin shells                                                │
│   - Compose feature screens                                    │
│   - Enforce auth/role guards via _layout.tsx                   │
└────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│ Features (features/<feature>/screens, components, hooks)       │
│   - Contain all business UI                                    │
│   - Hooks own side effects + caching                           │
│   - Components are presentational                              │
└────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│ API layer (features/<feature>/api/*.api.ts or *ApiSlice.ts)    │
│   - Single Supabase client                                     │
│   - RTK Query for cacheable reads                              │
│   - Plain async functions for one-shot writes                  │
└────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│ Supabase (Postgres + RLS + RPCs + Edge Functions + Storage)    │
└────────────────────────────────────────────────────────────────┘
```

---

## Provider tree (`app/_layout.tsx`)

Order matters — children depend on parents.

```
<ReduxProvider>
  <ThemeProvider>           // brand-aware theming, also mounts <StatusBar />
    <ToastProvider>
      <AppAlertProvider>
        <AuthBootstrap />   // hydrates session + listens to deep links / auth state
        <SafeAreaProvider>
          <SafeAreaView edges={["top","bottom"]}>
            <AppErrorBoundary>
              <Stack screenOptions={{ headerShown: false }} />
            </AppErrorBoundary>
          </SafeAreaView>
        </SafeAreaProvider>
      </AppAlertProvider>
    </ToastProvider>
  </ThemeProvider>
</ReduxProvider>
```

---

## Route gating

- `/app/index.tsx` reads `auth.status`, calls `useMyProfile()`, and `<Redirect />`s based on:
  1. `unauthenticated` → `/(auth)/sign-in`
  2. error → `/(auth)/sign-in?error=…`
  3. no first/last name → `/(onboarding)/profile`
  4. `roleConfirmed === false` → `/(onboarding)/role`
  5. `role === "trainer"` → `/(trainer)/(tabs)/dashboard`
  6. `role === "client"` → `/(client)/(tabs)/dashboard`
- `/(trainer)/_layout.tsx` blocks unauthenticated and clients (redirects accordingly).
- (Symmetric guard expected for `(client)/_layout.tsx`. **Needs verification** — file not yet inspected at the time of writing.)

---

## Data flow

### Reads

- **Long-lived, cacheable, shared between screens** → use **RTK Query** in a feature `*ApiSlice.ts` file. Tag every endpoint, invalidate on mutations. Examples: `getTrainerClients`, `getMyCoach`, `getMyUserRow`, `getTrainerProfile`.
- **Short-lived or screen-local** → plain async function in a `*.api.ts` file, called from a hook (`useEffect` or event). Examples: `listClientWorkoutAssignments`, `fetchProgramTemplateById`.

### Writes

- Always go through a service function that wraps `supabase.rpc(…)` or `supabase.from(…).update/insert/delete(…)`.
- After a successful write that affects RTK Query data, invalidate the appropriate tag (or refetch the screen-local hook).
- Toast errors via `appToast.error(message)`. Use `useAppAlert` for confirmations.

### Auth state

- `auth` slice (`features/auth/store/authSlice.ts`) holds `status`, `userId`, `accessToken`, `role`, `errorMessage`.
- `profile` slice (`features/profile/store/profileSlice.ts`) caches the current user row, client profile, and trainer profile so the UI can render synchronously.
- `useMyProfile()` keeps `profile` in sync with the server via RTK Query.

### Realtime

The codebase does not subscribe to Supabase Realtime channels at the time of writing. New realtime subscriptions should:

- live in a hook (`useXSubscription`) inside the feature folder,
- always unsubscribe in cleanup,
- coexist with RTK Query by calling `dispatch(api.util.invalidateTags([...]))` on relevant changes.

---

## Theming model

- **Tokens** live in `/shared/ui/theme/tokens.ts`. Dark-only.
- **`ThemeProvider`** (`/shared/ui/theme/ThemeProvider.tsx`) reads the user's role:
  - **Trainer**: overlays their own `primaryColor` / `secondaryColor` from `trainerProfiles` onto `accent` / `accent2`.
  - **Client**: overlays their **coach's** `primaryColor` / `secondaryColor` (from `useGetMyCoachQuery`) onto `accent` / `accent2`.
- All UI primitives consume `useTheme()` rather than referencing colors directly.

---

## i18n + RTL

- `/shared/i18n/i18n.ts` initializes i18next with `en | fr | ar`. Language is detected from `expo-localization`.
- `applyRtlIfNeeded(defaultLanguage)` (`/shared/i18n/rtl.ts`) flips `I18nManager.isRTL` for Arabic.
- All user-facing strings must use `useAppTranslation()` (`/shared/i18n/useAppTranslation.ts`).

---

## Error & loading UX

- `<AppErrorBoundary />` catches render-tree crashes.
- `<FullscreenState />` is the canonical "initializing / progress / error" splash for the index gate.
- Async hooks should always expose `{ isLoading, error, data }` shapes and screens should render skeleton or spinner accordingly.

---

## Build & deployment

- **EAS Build** (`eas.json`):
  - `development` (developmentClient: true, distribution: internal)
  - `preview` (internal)
  - `production` (autoIncrement: true)
- Native folders `/ios` and `/android` are gitignored — generated by EAS or `expo prebuild` if needed.
- `expo-router` typed routes are emitted to `.expo/types/router.d.ts`.

---

## Things you must not do

- ❌ Instantiate a new Supabase client. Always import from `@/shared/supabase/client`.
- ❌ Call `supabase` directly from a component. Wrap it in a hook or service.
- ❌ Hardcode user-facing text. Use `useAppTranslation`.
- ❌ Hardcode colors, spacings, or radii. Use `useTheme()` tokens.
- ❌ Use `Alert.alert` for confirmations. Use `useAppAlert`.
- ❌ Use `console.log` in production code paths. Acceptable for diagnostic temporary debugging only — remove before commit.
- ❌ Add a new global state slice without registering it in `rootReducer.ts` and documenting it in `state-management.md`.
- ❌ Add a new dependency without documenting it in `tech-stack.md`.
