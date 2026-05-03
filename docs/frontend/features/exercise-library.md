# Exercise Library

## Status

Implemented (read + edit + builder picker). Stock exercises are read-only.

## Purpose

A trainer's catalog of exercises, made of:

- **Stock exercises** — `exercises.isStock=true`, owned by no one, visible to every trainer.
- **Trainer-owned exercises** — `exercises.ownerTrainerId = auth.uid()`, fully editable.
- **Shared exercises** — visible/editable through `templateShares` rows (asset type `exercise`).

The library powers two flows:

1. The **Library → Exercises** screen (browse + edit).
2. The **workout builder picker** (select exercises to add to a workout).

## User Flow

1. Trainer goes to **Library → Exercises** (`/(trainer)/library/exercises`) → list, with search and target-muscle filter.
2. Tapping an exercise → `ExerciseDetailScreen` (read or edit).
3. From the workout builder, **+ Add exercise** opens `ExercisePickerScreen` → multi-select picker → returns ids via `exercisePickerBridge.ts` to the builder.
4. Editing an owned exercise updates `exercises` (RLS allows owner or shared-with-edit).

## Main Files

- API
  - `shared/api/exercises.api.ts` — list + search.
  - `features/builder/api/exercises.api.ts` — builder-side helpers (legacy / **Needs verification** — overlap with shared).
- Hooks
  - `features/library/hooks/useExerciseLibrary.ts`
  - `features/library/hooks/exercises/useExercises.ts`
- Screens
  - `features/library/screens/ExercisesScreen.tsx`
  - `features/builder/screens/ExerciseDetailScreen.tsx`
  - `features/builder/screens/ExercisePickerScreen.tsx`
- Components
  - `shared/ui/components/ExerciseLibraryCard.tsx` (display card)
  - `features/builder/components/ExerciseCard.tsx`
- Types & utils
  - `shared/types/exercise.ts`
  - `features/builder/types/exercise.ts`
  - `features/builder/utils/exercisePickerBridge.ts`
- Routes
  - `app/(trainer)/library/exercises.tsx`
  - `app/(trainer)/library/workout-builder/exercise-picker.tsx`
  - `app/(trainer)/library/workout-builder/exercise/[exerciseId].tsx`

## Components

- `ExerciseLibraryCard` — single card with image, title, muscles, equipment chips.
- `ExercisePickerScreen` — search + filter + multi-select picker for the builder.
- `ExerciseDetailScreen` — view/edit form (title, instructions, image, video, target muscles, equipment).

## Hooks

- `useExercises({ search, targetMuscles })` — RTK Query backed list with debounced search.
- `useExerciseLibrary()` — high-level wrapper used by the library screen (filters, sort).

## State Management

- RTK Query for the list and individual fetches.
- Local UI state for filter chips and search input.
- Picker → builder hand-off uses a small `exercisePickerBridge` module (a typed event bus) instead of nav params, to support multi-select returning to the builder.

## API / Supabase Dependencies

### Tables
- `exercises` — RLS:
  - `SELECT`: `isStock=true OR ownerTrainerId=auth.uid() OR shared via templateShares`.
  - `INSERT`: must set `ownerTrainerId=auth.uid()` and `isStock=false`.
  - `UPDATE`: owner or shared-with-`edit` (note: `WITH CHECK true` — see Known Issues).
  - `DELETE`: owner only.

### Storage
- `exercises` bucket (public) for image uploads.

### Triggers
- `trg_exercises_audit` (BEFORE INSERT/UPDATE) → `anvil_set_template_audit_fields` populates audit fields.
- `trg_exercises_lock` (BEFORE UPDATE) → `anvil_lock_creator_owner_fields` prevents changing creator/owner.

## Validation Rules

- Title: required, 1–120 chars.
- Instructions: optional.
- `targetMuscles`: array of `exercise_target_muscle` enum values.
- `equipment`: array of `exercise_equipment` enum values.
- Image: square JPEG ≤ 1MB after compression (handled by `pickAndPrepareSquareImage`).

## UI / UX Rules

- Image first, title under, chips below.
- Search input pinned to top.
- Filter chips are scrollable horizontally.
- Selection state in the picker uses brand accent.

## iOS + Android Notes

- Image upload uses `expo-image-picker`; permission requested just-in-time.
- Image rendering uses `expo-image` with `cachePolicy='memory-disk'`.
- Avoid massive scroll lists — `FlatList` already used; tune `windowSize`.

## SOLID / Architecture Notes

- Two API files exist (`shared/api/exercises.api.ts` and `features/builder/api/exercises.api.ts`). Consolidate to `shared/api` and have the builder import from it. Tracked in tech debt.
- The picker uses a small bridge module so callers don't pass arrays through `router.push` params.

## Performance Notes

- Stock + owned + shared lists deduplicate client-side; if the dataset grows, prefer a DB function/view.
- Image cache via `expo-image` reduces re-decoding when scrolling back.
- Debounce search input by 250ms.

## Known Issues

- `exercises_update` RLS has `WITH CHECK true` — flagged by the security advisor. Document intent (owner-or-shared-with-edit on USING is the actual gate) or tighten the WITH CHECK.
- Two API files for exercises — refactor into one.
- Video URL field is stored on `exercises.videoUrl`, but the player UI is in the builder (`VideoPlayerModal`). Hosting/upload flow is **Needs verification**.

## Last Updated

2026-05-03 — initial documentation generated.
