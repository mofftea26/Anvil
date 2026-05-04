# Folder Structure

```
/
├── AGENTS.md                        ← always-read AI instructions
├── README.md                        ← Expo starter readme (untouched template)
├── app.json                         ← Expo config (slug, plugins, experiments)
├── eas.json                         ← EAS build profiles
├── babel.config.js                  ← module-resolver aliases + reanimated plugin
├── tsconfig.json                    ← strict TS, path aliases
├── eslint.config.js                 ← flat config, expo preset
├── package.json                     ← scripts and deps
├── pnpm-lock.yaml
│
├── app/                             ← Expo Router routes (file-based)
│   ├── _layout.tsx                  ← Root: providers + Stack
│   ├── index.tsx                    ← Auth/role gate redirect
│   ├── (auth)/                      ← sign-in, sign-up, forgot-password, reset-password
│   ├── (onboarding)/                ← profile, role
│   ├── (trainer)/                   ← Trainer area
│   │   ├── _layout.tsx              ← Stack with auth/role guard
│   │   ├── (tabs)/                  ← Dashboard / Library / Clients / Profile
│   │   ├── add-client.tsx           ← Add-client modal route
│   │   ├── clients-without-program.tsx
│   │   ├── check-ins.tsx
│   │   ├── client/[clientId].tsx    ← Client detail
│   │   └── library/                 ← Programs, workouts, exercises, set-types
│   │       ├── _layout.tsx
│   │       ├── programs.tsx
│   │       ├── program-templates/[programId].tsx
│   │       ├── workouts.tsx
│   │       ├── workout-builder/
│   │       │   ├── new.tsx
│   │       │   ├── [workoutId].tsx
│   │       │   ├── exercise-picker.tsx
│   │       │   └── exercise/[exerciseId].tsx
│   │       ├── exercises.tsx
│   │       ├── set-types.tsx
│   │       └── create-program.tsx
│   └── (client)/                    ← Client area
│       ├── (tabs)/                  ← Dashboard / Workouts / Coach / Profile
│       ├── find-trainer.tsx
│       ├── link-trainer.tsx
│       ├── workouts/                ← assigned, sessions, run, program-assignment
│       └── runner/                  ← (currently empty)
│
├── features/                        ← Feature folders (business code)
│   ├── auth/                        ← sign-in, sign-up, recovery, AuthBootstrap
│   │   ├── api/authApiSlice.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── store/authSlice.ts
│   │   └── types/auth.ts
│   ├── onboarding/                  ← screens only (uses profile API)
│   ├── dashboard/                   ← TrainerDashboardScreen + ClientDashboardScreen
│   ├── clients/                     ← Trainer client list/details/assignments
│   │   ├── api/assignments.api.ts
│   │   ├── api/clientsWithoutProgram.api.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   └── screens/
│   ├── checkins/                    ← Trainer check-in timeline (clientCheckIns RPCs)
│   │   ├── api/checkins.api.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   └── types.ts
│   ├── library/                     ← Programs, workouts, exercises, set types (trainer)
│   ├── workouts/                    ← Client schedule + workout runner + sessions
│   ├── builder/                     ← Workout & exercise builder (trainer)
│   ├── profile/                     ← Trainer & client profile + me hook
│   ├── linking/                     ← Trainer ↔ client linking flows
│   └── assignments/                 ← Cross-cutting assignment helpers
│
├── shared/                          ← Cross-feature reusable code
│   ├── api/                         ← shared RTK Query api + exercises.api.ts
│   ├── components/                  ← AppErrorBoundary, AppInput, FullscreenState, …
│   ├── constants/                   ← countries.ts
│   ├── hooks/                       ← useAppDispatch, useAppSelector
│   ├── i18n/                        ← i18next setup, RTL helper, useAppTranslation
│   │   └── resources/{en,fr,ar}.json
│   ├── media/                       ← Image upload helpers
│   ├── supabase/client.ts           ← Single Supabase client
│   ├── types/                       ← Shared TS types (e.g. exercise.ts)
│   ├── ui/                          ← Theme + UI primitives + alert/toast/layout
│   │   ├── alert/AppAlertProvider.tsx
│   │   ├── components/              ← Button, Card, Chip, Input, Text, Icon, …
│   │   ├── layout/                  ← KeyboardScreen, Stack, TabBackgroundGradient
│   │   ├── theme/                   ← tokens.ts + ThemeProvider.tsx
│   │   ├── toast/                   ← appToast + ToastProvider
│   │   ├── utils/                   ← UI helpers (iconMapping, etc.)
│   │   └── index.ts                 ← Public re-exports
│   └── utils/                       ← formatSlugToLabel, scheduleTimeOverrides
│
├── store/                           ← Redux store wiring
│   ├── store.ts                     ← configureStore + RTK Query middleware
│   └── rootReducer.ts               ← combineReducers
│
├── types/                           ← (currently empty placeholder for shared types)
│
├── supabase/                        ← Backend artifacts (mirrored to live project)
│   ├── ARCHITECTURE_NOTES.md        ← Manual notes; superseded by /docs/supabase/
│   ├── migrations/                  ← SQL migrations
│   └── functions/                   ← Edge Functions (Deno)
│
├── scripts/                         ← Local scripts (reset-project, dump-schema)
└── assets/                          ← Icons, splash, fonts
```

## Where to put new code

| You want to…                                              | Put it in…                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| Add a new screen for an existing feature                  | `features/<feature>/screens/`, then a thin route in `app/…/`. |
| Add a new screen for a brand-new feature                  | Create `features/<feature>/{api,components,hooks,screens}` first. |
| Add a Supabase call                                       | A `*.api.ts` file (preferred) or an `injectEndpoints` slice in the feature folder. Never call `supabase` directly from a component. |
| Add a reusable button/input/card                          | `shared/ui/components/` and re-export from `shared/ui/index.ts`. |
| Add a non-UI utility used by 2+ features                  | `shared/utils/`.                                             |
| Add a strictly-feature utility                            | `features/<feature>/utils/`.                                 |
| Add a translation                                         | All three of `shared/i18n/resources/{en,fr,ar}.json`.        |
| Add a new global slice                                    | `features/<feature>/store/<feature>Slice.ts` and register in `store/rootReducer.ts`. |
| Add a new RPC or migration                                | `supabase/migrations/<timestamp>_<name>.sql` and document in `/docs/supabase/`. |
