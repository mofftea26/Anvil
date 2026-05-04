# Navigation

Anvil uses **expo-router 6** with file-based routing and **typed routes** (`app.json` → `experiments.typedRoutes: true`).

## Top-level layout

`app/_layout.tsx` mounts global providers and a single `<Stack screenOptions={{ headerShown: false }} />`. No header is shown anywhere by default; screens render their own headers if needed.

## Route groups

| Group              | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `(auth)`           | Sign-in, sign-up, password recovery.                          |
| `(onboarding)`     | First-launch profile capture and role confirmation.           |
| `(trainer)`        | Trainer surface (tabs + library + client detail + add-client).|
| `(client)`         | Client surface (tabs + workouts + linking flows).             |

Groups are not part of the URL path — they exist for layout grouping only.

## Auth/role gate

`app/index.tsx` is the entry route after the splash. It performs:

```
auth.status === idle | loading        →  <FullscreenState progress=0.35 />
auth.status === error                 →  Redirect /(auth)/sign-in?error=…
auth.status === unauthenticated       →  Redirect /(auth)/sign-in
auth.status === authenticated:
  isLoading profile                   →  <FullscreenState progress=0.75 />
  no firstName/lastName               →  Redirect /(onboarding)/profile
  !roleConfirmed                      →  Redirect /(onboarding)/role
  role === trainer                    →  Redirect /(trainer)/(tabs)/dashboard
  role === client                     →  Redirect /(client)/(tabs)/dashboard
```

The trainer area also has a guard in `app/(trainer)/_layout.tsx` that redirects clients to their dashboard. The symmetric guard for `(client)` is expected but **needs verification**.

## Tab bars

Both tab layouts use `expo-router`'s `<Tabs />` and share the same theme tokens (`surface` background, `accent` active tint, `border` top border). Heights are `74` with `paddingTop/Bottom: 10`.

### Trainer tabs (`app/(trainer)/(tabs)/_layout.tsx`)

| Tab        | Route               | Icon (focused / unfocused)              |
| ---------- | ------------------- | --------------------------------------- |
| Dashboard  | `dashboard`         | `analytics` / `analytics-outline`       |
| Library    | `library`           | `layers` / `layers-outline`             |
| Clients    | `clients`           | `people` / `people-outline`             |
| Profile    | `profile`           | `person` / `person-outline`             |

> Note: `library` exists both as a tab (`(tabs)/library.tsx`) and as a sibling stack (`(trainer)/library/`). The tab is the entry point; the stack hosts the deeper screens (program editor, workout builder, exercise picker, set-types dictionary).

### Client tabs (`app/(client)/(tabs)/_layout.tsx`)

| Tab        | Route               | Icon (focused / unfocused)              |
| ---------- | ------------------- | --------------------------------------- |
| Dashboard  | `dashboard`         | `dashboard` / `dashboard-outline`       |
| Workouts   | `workouts`          | `calendar-03` (focused & unfocused)     |
| Coach      | `coach`             | `barbell` / `barbell-outline`           |
| Profile    | `profile`           | `person` / `person-outline`             |

The client tab item uses pill-shaped `tabBarItemStyle` (radius 999, marginHorizontal 8) to match the brand.

## Deep links

- Scheme: `anvil` (set in `app.json`).
- Auth deep links are produced by `Linking.createURL("/")` and `Linking.createURL("/(auth)/reset-password")` in `features/auth/api/authApiSlice.ts`.
- `useAuthBootstrap()` (in `features/auth/hooks/`) handles inbound URLs:
  - `?code=` — PKCE: `supabase.auth.exchangeCodeForSession(code)`
  - `#access_token=…&refresh_token=…` — OTP/magic: `supabase.auth.setSession({ access_token, refresh_token })`
- It also subscribes to `Linking.addEventListener("url", …)` and to `supabase.auth.onAuthStateChange` for session updates.

> **Configure these redirect URLs in Supabase Auth → URL Configuration**:
> - `anvil://` (production scheme)
> - `exp://…` (Expo Go, dev only)
> - Any production URL if you also serve the web target

## Modal vs stack screens

There is no explicit `presentation: "modal"` config in the codebase. Every screen pushes onto the local stack. If a screen should feel modal (e.g. `add-client.tsx`), it currently uses normal stack push. Document any change to `presentation` here.

## Typed routes

With `typedRoutes: true`, Expo generates `.expo/types/router.d.ts`. Use the typed `Href` shape when calling `router.push({ pathname: "/(trainer)/client/[clientId]", params: { clientId } })`.

## Routes index

Trainer:
- `/(trainer)/(tabs)/{dashboard,library,clients,profile}`
- `/(trainer)/add-client`
- `/(trainer)/client/[clientId]`
- `/(trainer)/clients-without-program` — clients with no active program; quick assign program
- `/(trainer)/check-ins` — trainer check-in timeline (`clientCheckIns`)
- `/(trainer)/library/{programs,workouts,exercises,set-types,create-program}`
- `/(trainer)/library/program-templates/[programId]`
- `/(trainer)/library/workout-builder/{new,[workoutId],exercise-picker}`
- `/(trainer)/library/workout-builder/exercise/[exerciseId]`

Client:
- `/(client)/(tabs)/{dashboard,workouts,coach,profile}` — workouts tab honors `?tab=schedule|program|history|stats`.
- `/(client)/find-trainer`
- `/(client)/link-trainer`
- `/(client)/program/[assignmentId]` — program progress (info + calendar grid); canonical path from dashboard / My Program.
- `/(client)/workouts/assigned/[assignmentId]`
- `/(client)/workouts/program-assignment/[assignmentId]` — same `ProgramProgressScreen` as `/(client)/program/[assignmentId]` (legacy path retained).
- `/(client)/workouts/program-assignment/[assignmentId]/day/[dayKey]`
- `/(client)/workouts/run/[assignmentId]`
- `/(client)/workouts/sessions/[sessionId]`
- `/(client)/runner/` *(empty placeholder; reserved for future runner sub-routes)*

Auth & onboarding:
- `/(auth)/{sign-in,sign-up,forgot-password,reset-password}`
- `/(onboarding)/{profile,role}`
