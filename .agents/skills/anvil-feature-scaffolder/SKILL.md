---
name: anvil-feature-scaffolder
description: Scaffold a new Anvil frontend feature. Use when adding a new top-level feature under /features/, when the user says "create a feature", "add a feature", "scaffold <name> feature", or when starting any feature that needs the standard folder layout, route shell, RTK Query slice, and feature doc. Triggers on Anvil-specific scaffolding requests.
---

# Anvil Feature Scaffolder

Scaffolds a new feature under `/features/<name>/` with the standard subfolders, a thin route shell under `/app/`, an RTK Query slice attached to the shared API, an i18n namespace stub, and a feature doc that follows the project template.

Use when:

- The user asks to create a new feature, a new section of the app, or a new screen that doesn't fit any existing feature.
- You're starting a non-trivial change that crosses several files and would benefit from the standard scaffold up-front.

**Do not use** for trivial single-screen tweaks or for changes inside an existing feature.

## Inputs to gather first

Before writing files, confirm with the user (ask if not stated):

1. **Feature name** in `kebab-case` (folder name) and `PascalCase` (component prefix). Example: `clients-billing` and `ClientsBilling`.
2. **Side**: `(trainer)` / `(client)` / both.
3. **Primary screens** the feature needs (1–3 short descriptions).
4. **Backend touch**: read-only / writes via RPCs / writes via Edge Functions / no backend.
5. **i18n namespace** (default to the kebab-case name).

If anything is unclear, stop and ask before writing files.

## Steps

### 1. Read the runbook

Read `/docs/frontend/how-to-add-a-feature.md` once. Don't skip — the skill is the short version, the runbook is the contract.

### 2. Create the feature folder

```
features/<name>/
  api/<name>ApiSlice.ts
  components/.gitkeep
  hooks/use<Name>.ts
  screens/<Name>Screen.tsx
  types/<name>.ts
  utils/.gitkeep
```

Add `store/` only if the feature has UI-only state worth a slice.

### 3. Create the route shell(s)

For each side the user picked, add a thin file under `/app/(side)/<name>.tsx`:

```tsx
import <Name>Screen from "@/features/<name>/screens/<Name>Screen";
export default <Name>Screen;
```

If the feature has nested routes, add `app/(side)/<name>/_layout.tsx` to configure stack/tabs only — no logic.

### 4. Create the RTK Query slice

`features/<name>/api/<name>ApiSlice.ts` follows the `injectEndpoints` pattern in `/docs/frontend/how-to-add-a-feature.md` (section 5a). Important rules:

- Use `queryFn` (not `query`) and wrap `supabase.*` calls.
- Map errors to `ApiError` (`{ message: error.message }`).
- Provide tags with `{ type, id }` granularity, not flat `[type]`.
- Set `keepUnusedDataFor` deliberately.
- If you add a new tag type, also add it to `tagTypes` in `shared/api/api.ts`.

### 5. Stub the screen and the hook

Screen: thin container that calls one or two hooks and renders presentational components from `@/shared/ui`. No `supabase.*` here.

Hook: owns the side effects, derivations, prefetching.

### 6. Add i18n stubs

Add `<namespace>.title` and `<namespace>.empty` (or feature-relevant keys) to `shared/i18n/resources/en.json`, `fr.json`, **and** `ar.json`. Empty string is OK for fr/ar — the i18n-check script flags it as a warning, not an error. **Do not** commit a key in only one of the three files.

### 7. Create the feature doc

`docs/frontend/features/<name>.md` — copy the template from `.cursor/rules/30-feature-docs.mdc`. Fill in everything you can; mark unknowns as `Needs verification`.

### 8. Update the feature index

Add a row to `docs/frontend/features/README.md`:

```
| [<name>](./<name>.md) | `features/<name>/` | Implemented or Partially implemented | <one-line summary> |
```

### 9. Append a changelog entry

Append to `docs/decisions/changelog.md` using the format from `/AGENTS.md`. Include the new files and the new doc.

### 10. Run the local checks

```
pnpm i18n:check
pnpm docs:lint
```

Both must pass before you hand the feature back to the user.

## What to NOT do

- Do not place business logic in the route file (`/app/.../<name>.tsx`).
- Do not call `supabase.from(...)` in screens or components.
- Do not introduce a new top-level dependency (FlashList, lottie, etc.) without an ADR.
- Do not skip the i18n stubs for fr/ar.
- Do not skip the feature doc.

## Done definition

The feature compiles, both checks pass, and the user can navigate to a route shell that renders the (possibly empty) screen. Backend integration can land in subsequent commits, but the scaffold is complete.
