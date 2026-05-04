# Anvil Documentation

This is the living documentation for the **Anvil** app — a personal-training platform with a React Native + Expo client and a Supabase backend.

> Read `/AGENTS.md` first. It is the always-read instruction file for AI assistants.

---

## What Anvil Is

Anvil is a two-sided fitness app:

- **Trainers** build exercise libraries, workout templates, and multi-phase programs; manage clients; assign workouts/programs; and brand the app with their colors and logo.
- **Clients** see their schedule, run guided workout sessions, log sets, and track progress against assigned programs.

The two sides share one Postgres schema with row-level security driving access. Trainer ↔ client links are the spine of every authorization decision.

---

## How to Navigate the Docs

```
/AGENTS.md                         ← always-read instructions for AI agents
/docs/README.md                    ← this file (start here for humans)

/docs/frontend/
  README.md                        ← frontend index
  architecture.md                  ← overall frontend architecture
  tech-stack.md                    ← every dependency and why it's here
  folder-structure.md              ← what lives where
  navigation.md                    ← Expo Router groups, deep links, gating
  state-management.md              ← Redux Toolkit + RTK Query model
  api-layer.md                     ← Supabase access patterns
  theme-and-ui.md                  ← tokens, primitives, brand theming
  animations.md                    ← Reanimated guidelines
  performance.md                   ← rendering, lists, caching, image perf
  testing.md                       ← current testing posture
  platform-notes-ios-android.md    ← platform parity notes

/docs/frontend/features/
  auth.md
  onboarding.md
  trainer-dashboard.md
  client-dashboard.md
  clients.md
  programs.md
  workouts.md
  workout-runner.md
  exercise-library.md
  profile.md
  checkins.md
  settings.md
  notifications.md

/docs/supabase/
  README.md                        ← backend index
  schema.md                        ← schema overview & ERD
  tables.md                        ← every table, columns, indexes
  relationships.md                 ← FKs and cardinality
  rls-policies.md                  ← every RLS policy
  rpc-functions.md                 ← every RPC, with security model
  edge-functions.md                ← every Edge Function
  storage.md                       ← buckets, MIME types, policies
  auth.md                          ← Supabase Auth setup & assumptions
  triggers.md                      ← every trigger
  mcp-usage.md                     ← how to use the Supabase MCP server here
  environment.md                   ← env vars and secrets

/docs/decisions/
  architecture-decisions.md        ← ADRs
  technical-debt.md                ← known issues to fix later
  changelog.md                     ← log of every change to docs/code/db
```

---

## Running the App Locally

```bash
pnpm install
pnpm start              # opens Expo Dev tools
pnpm ios                # iOS simulator
pnpm android            # Android emulator
pnpm web                # web (secondary target)
```

Required env vars (in `.env`, see `/docs/supabase/environment.md`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<publishable-key>     # never the service role key
```

Build profiles (EAS):

```bash
pnpm build:android:dev | build:android:preview
pnpm build:ios:dev     | build:ios:preview
```

---

## High-Level Flow

1. App boots → `app/_layout.tsx` mounts providers (`Redux`, `Theme`, `Toast`, `Alert`, `SafeArea`, `ErrorBoundary`).
2. `AuthBootstrap` runs `useAuthBootstrap`, which hydrates the Supabase session, handles deep links (PKCE / magic link), and updates `auth` slice.
3. `app/index.tsx` redirects based on auth + profile state:
   - `unauthenticated` → `/(auth)/sign-in`
   - missing name → `/(onboarding)/profile`
   - role not confirmed → `/(onboarding)/role`
   - `trainer` → `/(trainer)/(tabs)/dashboard`
   - `client` → `/(client)/(tabs)/dashboard`
4. Inside a tab section, screens live in feature folders and talk to Supabase via RTK Query slices or feature-specific `*.api.ts` services.

---

## Documentation Status

This documentation set was bootstrapped on **2026-05-03** by inspecting the live codebase and the live Supabase project (`ekvwvxmpuwscqvfzlpek`). Where information could not be fully verified at that time it is marked `Needs verification`.

For the latest changes, see `/docs/decisions/changelog.md`.
