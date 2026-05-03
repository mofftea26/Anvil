# Architecture Decision Records

Append-only log of architectural decisions. Each entry follows the lightweight ADR format below. Update or supersede; never delete.

## Format

```
## ADR-NNN — Short title
Date: YYYY-MM-DD
Status: proposed / accepted / deprecated / superseded by ADR-XYZ
Area: frontend / supabase / build / cross-cutting

### Context
What problem are we solving and what constraints exist?

### Decision
What we decided and why.

### Consequences
What changes (positive, negative, follow-ups).
```

---

## ADR-001 — File-based routing with Expo Router 6
Date: 2026-01-11
Status: accepted
Area: frontend

### Context
We needed a routing solution that supports deep links, typed routes, and shared layouts for both trainer and client surfaces.

### Decision
Use Expo Router 6 with file-based routes under `/app`. Group routes under `(auth)`, `(onboarding)`, `(trainer)`, `(client)` and gate transitions in `app/index.tsx` based on the Redux `auth`/`profile` state. Enable `experiments.typedRoutes` for compile-time route safety.

### Consequences
- Clear ownership: each route is a small file under `/app` that imports a screen from `/features/<feature>/screens/`.
- Deep links work out of the box for the `anvil://` scheme.
- Adding a new route group is a directory + `_layout.tsx` away.
- Typed routes generate `.expo/types/router.d.ts` which must be in `.gitignore` (currently included by Expo's `.gitignore` add-ons).

---

## ADR-002 — Single shared RTK Query API with feature `injectEndpoints`
Date: 2026-01-15
Status: accepted
Area: frontend

### Context
We use Supabase JS rather than REST/GraphQL endpoints, so RTK Query can't generate from a schema. We still want global cache, tag invalidation, and request deduplication.

### Decision
Create one RTK Query `api` (`shared/api/api.ts`) with `fakeBaseQuery<ApiError>()` and `tagTypes`. Each feature calls `api.injectEndpoints({ endpoints: …, overrideExisting: false })` to attach its endpoints. Each `query/mutation` provides a `queryFn` that wraps `supabase.from(…)`/`supabase.rpc(…)` calls and maps the result.

### Consequences
- One cache, one middleware, no per-feature stores.
- Tag invalidation is the canonical way to refresh data across features.
- Discoverability of endpoints is harder — mitigated by listing them in [`api-layer.md`](../frontend/api-layer.md).

---

## ADR-003 — Feature-based folder structure
Date: 2026-01-15
Status: accepted
Area: frontend

### Context
The codebase grew quickly with overlapping concerns (workouts, programs, schedule, runner). A feature-based structure scales better than type-based (`/components`, `/hooks`, `/utils`).

### Decision
`features/<feature>/{api,components,hooks,screens,store,types,utils}` for any non-trivial feature. Cross-feature primitives live in `shared/`. Routes in `/app` are thin wrappers that import a screen from `features/<feature>/screens/`.

### Consequences
- Easy to find feature-specific code.
- Discourages deep cross-feature imports (linting could enforce this — not yet configured).
- Refactors that span features are larger but rarer.

---

## ADR-004 — Brand-aware theming via Redux `profile`
Date: 2026-02-01
Status: accepted
Area: frontend

### Context
A trainer's brand colors must apply to their own client list, the client's "My Coach" surface, and the gradient/tab accents on both sides.

### Decision
`shared/ui/theme/ThemeProvider.tsx` reads from the Redux `profile` slice and overrides `accent` / `accent2` based on the active trainer (own brand if trainer; linked-trainer brand if client). Brand fields live on `trainerProfiles` (`primaryColor`, `secondaryColor`).

### Consequences
- Live updates: changing brand colors in the profile editor instantly re-themes the app.
- Keep all derived theme values out of feature code — read from `useTheme()` only.
- Adding more dynamic theme axes should extend `ThemeProvider`, not feature components.

---

## ADR-005 — JSONB `state` as canonical workout/program structure
Date: 2026-03-01
Status: accepted (with migration backlog)
Area: supabase

### Context
The original schema had normalized tables for workout series/exercises/sets and for program phases/days. Building a tree UI on top of normalized rows required many round-trips.

### Decision
Store the full structure on `workouts.state` (JSONB) and `programTemplates.state` (JSONB). Keep the legacy tables for now to avoid breaking older code paths, but treat `state` as the source of truth in new code. RPCs (`anvil_update_*_state`, `anvil_extract_planned_workouts_from_state`, etc.) read/write JSONB directly.

### Consequences
- Reads are O(1) round-trip per template.
- Schema validation must happen in app code or via `pg_jsonschema` (not installed). Tracked in tech debt.
- Migration plan: drop the normalized children tables once no flow writes to them. Adopt `pg_jsonschema` for guardrails.

---

## ADR-006 — Edge Functions only for cross-user privileged writes
Date: 2026-02-15
Status: accepted
Area: supabase

### Context
Some writes require service-role access (e.g., creating an `auth.users` row for a client by email). We don't want to expose the service role key.

### Decision
Use Edge Functions only when:

1. The action requires service-role privileges (e.g., `auth.admin.createUser`), AND
2. The action validates the caller's JWT and re-checks role from the DB (don't trust JWT claims).

Everything else goes through `SECURITY DEFINER` RPCs in PostgreSQL with `_require_*` helpers. Current Edge Functions: `anvil-create-client` (see [`edge-functions.md`](../supabase/edge-functions.md)).

### Consequences
- Minimal cold-start surface.
- Two clear authorization checkpoints (JWT + DB role) for each Edge Function.
- Adding a new Edge Function requires an ADR.

---

## ADR-007 — Internationalization with `i18next` + RTL via `applyRtlIfNeeded`
Date: 2026-02-20
Status: accepted
Area: frontend

### Context
We need en/fr/ar with proper RTL handling for Arabic. React Native's `I18nManager.forceRTL` requires an app restart on Android.

### Decision
Use `i18next` + `react-i18next` with locale files in `shared/i18n/resources/`. Wrap text consumers with `useAppTranslation`. On language change, call `applyRtlIfNeeded(lang)` and (on Android) prompt the user to restart for full RTL effect.

### Consequences
- All user-facing strings must use `t(…)` — the `eslint-react/no-string-refs` style guidance is encouraged via review.
- New languages require a `<lang>.json` file and a fallback strategy.
- RTL layouts must respect `flexDirection: 'row'` defaults from RN (it auto-mirrors when `I18nManager.isRTL`).

---

## ADR-008 — Reanimated 4 + gesture handler as the only animation stack
Date: 2026-01-20
Status: accepted
Area: frontend

### Context
We need consistent, performant animations across iOS and Android.

### Decision
Use **Reanimated 4** worklets for animation and **react-native-gesture-handler** for gestures. Don't introduce Animated API or Lottie unless an ADR justifies it.

### Consequences
- Babel plugin `react-native-reanimated/plugin` must remain the **last** plugin in `babel.config.js`.
- Worklets carry constraints (no closures over non-shared values without serialization). Document carefully.

---

## Future ADRs to write

- Choice of analytics provider (none today).
- Choice of push provider (notifications feature).
- FlashList vs FlatList for very long lists (defer until lists exceed ~50 rows).
- Schema validation strategy for JSONB (`pg_jsonschema`).
