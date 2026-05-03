# Project AI Instructions

> This is the **always-read** instruction file for any AI assistant (Cursor, Claude, Codex, etc.) working on the **Anvil** React Native + Expo app and its Supabase backend.
> Treat it as the contract between you and this codebase. Read it **before every task**.

---

## Golden Rules

- Always read the relevant docs before making changes.
- Always update the relevant docs after making changes.
- Never create code without understanding the existing architecture.
- Never duplicate logic if a reusable hook, component, service, or utility should exist.
- Follow SOLID principles.
- Follow feature-based architecture (`/features/<feature>/{api,components,hooks,screens,store,types,utils}`).
- Keep side effects inside hooks or service layers, not inside presentational components.
- Keep components small and focused (≤ ~250 LOC; split otherwise).
- Separate container logic from presentational UI when complexity grows.
- Use TypeScript strictly (`strict: true` in `tsconfig.json`). No `any` unless documented.
- Use `camelCase` consistently for variables, functions, fields, and props.
- Never hardcode secrets. Use `EXPO_PUBLIC_*` env vars for the client (publishable key only).
- Never expose Supabase **service role keys** in the frontend. Service-role-only logic belongs in Edge Functions or RPCs.
- Always support iOS and Android together. Web is a secondary target (Expo web is enabled but not the primary surface).
- Always consider safe areas, keyboard avoidance, touch targets (min 44pt), permissions, and performance on both platforms.
- Use animations where they improve UX, but keep them performant (Reanimated 4 / native driver).
- Optimize lists with `FlatList`, memoization, stable callbacks, and stable keys. (FlashList is not currently a dependency — do not add it without an ADR.)
- Avoid unnecessary rerenders.
- Keep files readable and modular.
- Use clear naming.
- Use existing project conventions before introducing new patterns.
- Update documentation every time you add, remove, rename, or refactor anything.

---

## Before Every Task

You must:

1. Read `/AGENTS.md` (this file).
2. Read `/docs/README.md`.
3. Read the relevant frontend feature docs in `/docs/frontend/features/`.
4. Read the relevant Supabase docs in `/docs/supabase/` if the task touches backend, auth, database, storage, RPC, or Edge Functions.
5. Inspect the actual code before editing — file contents are the ground truth.
6. Identify whether documentation is outdated.
7. Update outdated documentation **before or after** the code change, depending on what is safer.

When inspecting Supabase, use the **Supabase MCP server** (`plugin-supabase-supabase`). Project ref: `ekvwvxmpuwscqvfzlpek` (project name: **Anvil**, region: `ap-south-1`).

---

## After Every Task

You must do all of this **in the same change** (same PR / same commit set) — never as a follow-up:

1. Update the changed feature docs.
2. Update architecture docs if structure changed.
3. Update Supabase docs if backend changed.
4. Update `/docs/decisions/changelog.md` with a short, dated summary.
5. Update `/docs/decisions/technical-debt.md` if you discover issues but do not fix them.
6. Make sure the docs match the real code. If you can't verify a detail, mark it as `Needs verification`.

If you say "I'll update the docs later" you've already broken the contract.

### Runbooks

For the most common change shapes, follow the runbooks instead of re-deriving the steps:

- Adding or refactoring a feature → [`/docs/frontend/how-to-add-a-feature.md`](docs/frontend/how-to-add-a-feature.md)
- Changing the database / RPCs / Edge Functions → [`/docs/supabase/how-to-change-the-schema.md`](docs/supabase/how-to-change-the-schema.md)

---

## Frontend Development Rules

This is a **React Native + Expo SDK 54** app with **expo-router 6** (file-based routing), **Redux Toolkit 2 + RTK Query** for state, **Supabase JS v2** for backend, **react-hook-form + zod** for forms, **react-i18next** for i18n, and **Reanimated 4** for animation.

Always develop for iOS and Android at the same time. Do not assume web.

### Architecture rules

- Features live in clear feature folders under `/features/<feature>/`.
- Routes (Expo Router) live in `/app/` and should be **thin shells** that import a screen component from `/features/<feature>/screens/`.
- Presentational components should not contain business logic.
- Hooks should own side effects, data fetching wiring, and reusable behavior.
- API/services (`/features/<feature>/api/*.api.ts` or `*ApiSlice.ts`) own external Supabase communication. Use the shared `supabase` client from `@/shared/supabase/client` — never instantiate a new one.
- Utilities should be pure where possible.
- Types should be shared (`/features/<feature>/types/` or `/shared/types/`) and reusable.
- Avoid large files. Refactor when a file becomes too big or has multiple responsibilities.
- Prefer absolute imports via path aliases: `@/`, `@/features/*`, `@/shared/*`, `@/store/*`, `@/types/*`.

### SOLID rules

- **SRP**: Each file, component, hook, and service has one clear responsibility.
- **OCP**: Make features extensible without rewriting core logic. Prefer composition.
- **LSP**: Components and utilities should be replaceable without breaking expected behavior.
- **ISP**: Avoid huge prop interfaces. Split into focused types.
- **DIP**: High-level UI depends on hooks/services, not raw `supabase.from(...)` chains in screens.

### Performance rules

- Avoid unnecessary state.
- Avoid unnecessary `useEffect`.
- Use `useMemo`/`useCallback` only when useful, not blindly. (React Compiler is enabled in `app.json` — `experiments.reactCompiler: true` — so trust the compiler for trivial cases.)
- Memoize expensive components.
- Use stable keys in lists (never `index` for dynamic data).
- Use `expo-image` for optimized image loading and caching.
- Avoid inline heavy calculations in render.
- Avoid creating new arrays/objects inside render when passed to memoized children.
- Use list virtualization for long data (`FlatList`).
- Keep animations smooth and non-blocking — prefer Reanimated worklets.
- Prevent excessive Supabase calls. Use RTK Query caching, `keepUnusedDataFor`, and tag invalidation.
- Cache where appropriate. Persist local-only state (e.g., schedule time overrides) via `AsyncStorage` or `SecureStore`.

### Animation rules

- Use animations to improve clarity and polish, not for decoration.
- Do not over-animate.
- Prefer Reanimated 4 worklets and `react-native-gesture-handler`.
- Keep gestures and transitions smooth (60 fps target).
- Animations must work on both iOS and Android.
- Document non-trivial animation decisions in `/docs/frontend/animations.md`.

### UI rules

- Follow the existing dark-only theme in `/shared/ui/theme/tokens.ts`.
- Use the brand-aware `ThemeProvider` (`/shared/ui/theme/ThemeProvider.tsx`) — trainers' brand colors override `accent`/`accent2` for themselves and for their linked clients.
- Keep design modern, clean, premium, and consistent.
- Respect dark theme — the app is **dark-only**. Status bar is `light`.
- Use consistent spacing (`theme.spacing`), typography (`Inter_400Regular | _600SemiBold | _700Bold`), radius (`theme.radii`), and colors.
- Create reusable UI primitives instead of repeating UI patterns. Use the primitives exported from `@/shared/ui` first (`Button`, `Card`, `Chip`, `Input`, `Text`, `Icon`, `IconButton`, `LoadingSpinner`, `BottomSheetPicker`, `KeyboardScreen`, `HStack`, `VStack`, etc.).
- Use `appToast` from `@/shared/ui` for notifications, and `useAppAlert` for confirmations.
- Use `useAppTranslation()` for all user-visible strings — never hardcode user-facing text.

---

## Supabase / MCP Rules

Use the **Supabase MCP server** (`plugin-supabase-supabase`) for backend inspection or changes. The active project is **Anvil** (ref `ekvwvxmpuwscqvfzlpek`).

### Before changing anything Supabase-related

1. Inspect current tables (`list_tables`).
2. Inspect columns and types (`information_schema.columns`).
3. Inspect relationships (`information_schema.table_constraints` + `key_column_usage`).
4. Inspect indexes (`pg_indexes`).
5. Inspect RLS policies (`pg_policies`).
6. Inspect triggers (`pg_trigger`).
7. Inspect RPC functions (`pg_proc` filtered by `pg_namespace.nspname='public'`).
8. Inspect Edge Functions (`list_edge_functions` + `get_edge_function`).
9. Inspect storage buckets (`storage.buckets`, `storage.objects` policies).
10. Inspect auth assumptions (RLS uses `auth.uid()` and `users` table linked 1:1 to `auth.users`).

Document everything you change in `/docs/supabase/`.

### Schema-change workflow

- Use `execute_sql` (MCP) to iterate freely while developing.
- Do **not** call `apply_migration` repeatedly during iteration — it writes a migration row each time and breaks `db diff`.
- When ready, create a real migration file:
  ```
  supabase migration new <descriptive-name>
  ```
  Place it under `/supabase/migrations/` and commit with the code change.
- Run `get_advisors` (`security` and `performance`) after the change. Fix issues or document them in `/docs/decisions/technical-debt.md`.

### Security rules

- Never put service role keys in frontend code.
- Never expose secrets in documentation. Use placeholders like `EXPO_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Respect RLS. Every table in `public` has RLS enabled.
- Do not bypass RLS unless explicitly required for secure server-side Edge Function logic. Edge Functions use the service role key and **must** validate the caller's JWT (`supabaseAdmin.auth.getUser(jwt)`) before any privileged write — see `supabase/functions/anvil-create-client/index.ts` for the canonical pattern.
- Document every function's security model (`SECURITY DEFINER` vs `SECURITY INVOKER`).
- Document whether a function is called from frontend, Edge Function, trigger, or admin-only flow.
- **Never use `user_metadata` for authorization decisions** in RLS policies — it is user-editable. Use `app_metadata` or the `users.role` column.
- For an UPDATE to take effect under RLS, the row must also be visible via SELECT. UPDATE policies need a matching SELECT path or they silently affect 0 rows.

### Function doc template

Every Supabase function doc must include:

```
# Function Name

## Type
RPC / Edge Function / Trigger Function

## Purpose

## Inputs

## Output

## Tables Used

## RLS / Security Notes

## Called From

## Error Cases

## Last Updated
```

### Table doc template

Every table doc must include:

```
# Table Name

## Purpose

## Columns

## Relationships

## Indexes

## RLS Policies

## Used By Frontend Features

## Used By Functions

## Notes

## Last Updated
```

> Tables can be documented in one consolidated `/docs/supabase/tables.md` (current convention) where each `##` section is a table and the inner sections follow the template. The same applies to `rpc-functions.md`.

### Feature doc template

Every frontend feature in `/docs/frontend/features/` must include these sections (matching `.cursor/rules/30-feature-docs.mdc`):

```
# Feature Name

## Status
Implemented / Partially implemented / Not implemented

## Purpose

## User Flow

## Main Files

## Components

## Hooks

## State Management

## API / Supabase Dependencies

## Validation Rules

## UI / UX Rules

## iOS + Android Notes

## SOLID / Architecture Notes

## Performance Notes

## Known Issues

## Last Updated
```

---

## Documentation Maintenance Rules

Whenever you modify code:

- Check whether a related doc exists.
- If it exists, update it.
- If it does not exist, create it.
- Never leave docs stale.
- Never say "documentation should be updated later." Update it now.
- If you are unsure, add a `Needs verification` note and explain what must be checked.

### Changelog format (`/docs/decisions/changelog.md`)

```
## YYYY-MM-DD
### Changed
- Short description.

### Files Updated
- List files.

### Docs Updated
- List docs.

### Supabase Updated
- Yes/No. If yes, explain.
```

### Technical debt format (`/docs/decisions/technical-debt.md`)

```
## Item Title
Status:       open / in-progress / resolved
Priority:     low / medium / high / critical
Area:         frontend / supabase / build / docs
Problem:
Suggested Fix:
Related Files:
Date Found:   YYYY-MM-DD
```

---

## Quick Project Facts

- **App name**: Anvil (Expo slug `anvil`, bundle `com.dancho26.anvil`).
- **Roles**: `trainer` and `client` (set in `users.role`, locked once `users.roleConfirmed = true`).
- **Auth**: Email/password and magic-link via Supabase Auth (PKCE deep links handled in `useAuthBootstrap`).
- **Routing groups**: `(auth)`, `(onboarding)`, `(trainer)`, `(client)` under `/app/`. The root `/app/index.tsx` redirects based on auth + role state.
- **Backend project ref**: `ekvwvxmpuwscqvfzlpek` (Postgres 17, region `ap-south-1`).
- **Public buckets**: `avatars`, `exercises`, `logos`. **Private bucket**: `pdfs`.
- **i18n**: `en`, `fr`, `ar` (Arabic triggers RTL via `applyRtlIfNeeded`).
- **State**: Redux Toolkit `store` with `authSlice`, `profileSlice`, and a single shared `RTK Query` API (`api`) into which feature slices `injectEndpoints`.

For full details, see `/docs/README.md`.
