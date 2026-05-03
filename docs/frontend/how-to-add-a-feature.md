# How to Add a New Feature

The canonical walkthrough for adding a non-trivial feature to Anvil. Follow it top-to-bottom.

> Optional shortcut: the `anvil-feature-scaffolder` agent skill (`.agents/skills/anvil-feature-scaffolder/SKILL.md`) does steps 1–3 and 8 for you.

---

## 0. Read first

- `/AGENTS.md`
- `/docs/README.md`
- The closest existing feature doc in `/docs/frontend/features/` (mirror its structure).
- `/docs/frontend/architecture.md`, `state-management.md`, `api-layer.md`, `theme-and-ui.md`.
- If the feature touches Supabase, also `/docs/supabase/how-to-change-the-schema.md`.

---

## 1. Scaffold the feature folder

Create `features/<feature>/` with the standard subfolders. Omit the ones you genuinely don't need; never spread a feature across other features.

```
features/<feature>/
  api/                # *.api.ts and/or *ApiSlice.ts (RTK Query injectEndpoints)
  components/         # presentational components
  hooks/              # side-effect hooks owning the feature behavior
  screens/            # screen components (consumed by /app/ shells)
  store/              # local slice if the feature has UI-only state
  types/              # local types; promote to /shared/types/ when reused
  utils/              # pure helpers (test-friendly)
```

Naming:
- Files / variables / functions / props: `camelCase`.
- Components / types / classes: `PascalCase`.
- Public exports through a single file when sensible (e.g., `features/<feature>/api/index.ts`).

---

## 2. Add the route shell in `/app/`

Routes are **thin shells** that import the screen.

`app/(trainer)/<feature>.tsx` (or `(client)`, depending on the side):

```tsx
import <Feature>Screen from "@/features/<feature>/screens/<Feature>Screen";

export default <Feature>Screen;
```

If the feature has nested routes, add a `_layout.tsx` to configure stack/tabs and gating only — no business logic.

---

## 3. Build the screen

Each screen is a thin container that:

1. Calls one or two feature hooks for data + actions.
2. Renders presentational components from `features/<feature>/components/` and primitives from `@/shared/ui`.
3. Stays under ~250 LOC. Split when it grows.

Example:

```tsx
import { VStack } from "@/shared/ui";
import { use<Feature>List } from "../hooks/use<Feature>List";
import { <Feature>ListView } from "../components/<Feature>ListView";

export default function <Feature>Screen() {
  const { items, isLoading, refresh } = use<Feature>List();
  return (
    <VStack flex={1}>
      <<Feature>ListView items={items} isLoading={isLoading} onRefresh={refresh} />
    </VStack>
  );
}
```

---

## 4. Build the hook

The hook owns side effects, RTK Query subscriptions, and derivations.

```tsx
import { useGet<Feature>ListQuery } from "../api/<feature>ApiSlice";

export function use<Feature>List() {
  const { data, isLoading, refetch } = useGet<Feature>ListQuery();
  const items = data ?? [];
  return { items, isLoading, refresh: refetch };
}
```

Side effects (telemetry, prefetching, deep-link handling) go here, not in the screen.

---

## 5. Add the API layer

Two patterns coexist:

### 5a. RTK Query slice (preferred for read-heavy data)

`features/<feature>/api/<feature>ApiSlice.ts`:

```tsx
import { api } from "@/shared/api/api";
import { supabase } from "@/shared/supabase/client";

declare module "@/shared/api/api" {
  // augment tagTypes if you add a new one
}

export const <feature>Api = api.injectEndpoints({
  overrideExisting: false,
  endpoints: (builder) => ({
    get<Feature>List: builder.query<Item[], void>({
      queryFn: async () => {
        const { data, error } = await supabase.from("<table>").select("*");
        if (error) return { error: { message: error.message } };
        return { data: data ?? [] };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: "<TagType>" as const, id: r.id })),
              { type: "<TagType>" as const, id: "LIST" },
            ]
          : [{ type: "<TagType>" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),
    upsert<Feature>: builder.mutation<Item, UpsertInput>({
      queryFn: async (input) => {
        const { data, error } = await supabase.from("<table>").upsert(input).select().single();
        if (error) return { error: { message: error.message } };
        return { data };
      },
      invalidatesTags: (result) =>
        result ? [{ type: "<TagType>", id: result.id }, { type: "<TagType>", id: "LIST" }] : [],
    }),
  }),
});

export const { useGet<Feature>ListQuery, useUpsert<Feature>Mutation } = <feature>Api;
```

If you add a new `tagType`, add it to `shared/api/api.ts` `tagTypes` array as well.

### 5b. Plain `*.api.ts` module (preferred for one-off mutations or imperative flows)

`features/<feature>/api/<feature>.api.ts` exports plain async functions that wrap `supabase.*`. Call from hooks or thunks.

---

## 6. Validation

- Use `react-hook-form` + `zod`. Keep schemas in `features/<feature>/types/<feature>Schema.ts` and reuse for both client-side validation and TypeScript inference.
- Translate every error message via `useAppTranslation()`.

---

## 7. i18n keys

For every user-visible string:

1. Add the key under a `<feature>.*` namespace to `shared/i18n/resources/en.json`.
2. Add the same key (translated) to `fr.json` and `ar.json`. **Do not commit a key that's missing in any of the three files.**
3. Run `pnpm i18n:check` before pushing.

For RTL, prefer `start` / `end` over `left` / `right`. Test with `applyRtlIfNeeded('ar')`.

---

## 8. Document the feature

Create `docs/frontend/features/<feature>.md` from the template in `.cursor/rules/30-feature-docs.mdc` (also reproduced in `/AGENTS.md`).

Required sections:

- `Status`, `Purpose`, `User Flow`, `Main Files`, `Components`, `Hooks`, `State Management`, `API / Supabase Dependencies`, `Validation Rules`, `UI / UX Rules`, `iOS + Android Notes`, `SOLID / Architecture Notes`, `Performance Notes`, `Known Issues`, `Last Updated`.

Add a row to `/docs/frontend/features/README.md` mapping the doc to the feature folder.

---

## 9. If the feature touches Supabase

Follow `/docs/supabase/how-to-change-the-schema.md`. Don't forget to:

- Inspect via the `plugin-supabase-supabase` MCP first.
- Iterate with `execute_sql`.
- Write **one** migration file, not many.
- Run `get_advisors` (security + performance).
- Update the relevant `/docs/supabase/*.md` files.

---

## 10. PR-time checklist

Before opening the PR, confirm:

- [ ] Feature folder follows the structure above.
- [ ] No business logic in `/app/` shells.
- [ ] No `supabase.from(...)` inside screens or presentational components.
- [ ] All user-visible strings go through `useAppTranslation()`.
- [ ] `pnpm i18n:check` passes.
- [ ] `pnpm docs:lint` passes.
- [ ] Feature doc created/updated.
- [ ] `/docs/frontend/features/README.md` mapping updated.
- [ ] `/docs/decisions/changelog.md` has a new dated entry.
- [ ] If Supabase touched: migration file added, advisors run, `/docs/supabase/*.md` updated.
- [ ] Tested on iOS and Android.
- [ ] No `any` (or it has a documented reason).
- [ ] No service role key in any client code.

---

## Last Updated

2026-05-03 — initial runbook authored as part of the docs / rules / skills audit pass.
