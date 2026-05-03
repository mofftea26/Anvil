# Performance

Anvil targets smooth 60 fps on mid-range Android and crisp interactions on iOS. The rules below are non-negotiable.

## Rendering

- React Compiler is enabled (`app.json` → `experiments.reactCompiler: true`). The compiler memoizes most pure components automatically. Don't reach for `useMemo`/`useCallback` reflexively — measure first.
- Add `React.memo` only when:
  - the component receives stable props from a memoized parent **and**
  - re-renders are noticeable (DevTools Profiler shows it).
- Stable callbacks: when passing handlers to a memoized child, wrap with `useCallback`.
- Stable keys: never use `index` as a `key` in dynamic lists. Use the row's id.

## Lists

The codebase uses `FlatList` (and `ScrollView` for short lists). FlashList is **not installed** — adding it is an ADR-level change.

For lists:

- Always set `keyExtractor`.
- Define `renderItem` outside the component or wrap with `useCallback` so it is stable.
- Set `getItemLayout` if rows are uniform — it skips measurement.
- Use `removeClippedSubviews={true}` for long lists on Android.
- Use `initialNumToRender` and `windowSize` to bound work.
- Pull-to-refresh: `refreshing` + `onRefresh`. Don't use a third-party refresh control.

## Images

- Use `expo-image` everywhere (`<Image source={{ uri }} />`). It caches and decodes off-thread.
- For avatars: use `cachePolicy="memory-disk"`.
- Set explicit `width`/`height` to avoid layout thrash.
- Don't use the React Native built-in `<Image />` for remote URIs.

## Supabase calls

- Cache via RTK Query for shared data. See `state-management.md`.
- Avoid N+1 patterns. Batch lookups with `.in("id", ids)` and merge in memory (see `getTrainerClients` in `features/linking/api/linkingApiSlice.ts`).
- Call `keepUnusedDataFor: 0` only for inboxes that **must** be fresh (see `getTrainerRequestsInbox`).
- Always pass date ranges to schedule reads (`p_from`, `p_to`) so Postgres can use the indexes.
- For `clientWorkoutAssignments` reads, prefer the RPCs `get_my_workout_schedule` and `get_my_program_assignments` over raw `select`. They are `SECURITY DEFINER` and avoid per-row RLS evaluation.

## Reanimated

See [`animations.md`](./animations.md). Run heavy work in worklets, transform-only animations, cancel on unmount.

## Storage

- Compress images before upload (`/shared/media/imageUpload.ts` already does this).
- Don't upload PDFs, videos, or other large assets via the Supabase JS client unless you've verified RLS and quota.
- Avoid base64-encoded payloads larger than ~2 MB through PostgREST.

## Cold start

- `useFonts` blocks render until Inter loads (`if (!fontsLoaded) return null;`). This is acceptable; just don't add many more fonts.
- `useAuthBootstrap` always sets `auth.status = 'loading'` first. The `<FullscreenState />` shows progress so the user never sees a flash of empty UI.
- Avoid heavy synchronous work in `app/_layout.tsx`. Move it into hooks.

## Debugging tools

- **React DevTools Profiler** — find re-render hotspots.
- **Hermes Profiler** — `npx react-native-debugger` or Chrome DevTools.
- **Flipper** (deprecated by RN, but still useful) — Layout, Network, Performance.
- **Supabase Dashboard → Performance** — query stats and `get_advisors`.

## Known issues / tracked debt

See [`/docs/decisions/technical-debt.md`](../decisions/technical-debt.md). Active items relevant to performance:

- `auth_rls_initplan` warnings for many RLS policies (re-evaluating `auth.uid()` per row).
- Unused indexes (35) — can be dropped after confirming no upcoming feature needs them.
- Multiple permissive policies on several tables — consolidate.
- Duplicate index on `trainerClients` — drop one.
