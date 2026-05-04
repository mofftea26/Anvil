# Profile

## Status

Implemented for both trainers and clients. Brand fields (color, logo, name) flow into the global theme via `ThemeProvider`.

## Purpose

Lets the signed-in user view and edit their profile:

- **Trainer**: brand info (name, primary/secondary color, logo), bio, certifications, social links, phone.
- **Client**: basic info (phone, nationality, gender, birthday), body metrics (height, weight), preferences (target, activity level, unit system, notes).

The current user's profile is also the source of `firstName/lastName/avatarUrl` (`users` table) which is shared by every screen via `useMyProfile`.

## User Flow

1. Trainer or client taps the **Profile** tab.
2. The matching screen mounts (`TrainerProfileScreen` or `ClientProfileScreen`), driven by `useMyProfile.role`.
3. Cards expose editable groups; each section calls a focused mutation (e.g. `updateUser`, `updateTrainerProfile`, `updateClientProfile`).
4. Avatar / logo upload uses `useSupabaseImageUpload` → uploads to `avatars` or `logos` bucket → stores public URL on the user/profile row.
5. After save, `useMyProfile` re-syncs and updates the Redux `profile` slice (which `ThemeProvider` reads to derive accent colors).

## Main Files

- API
  - `features/profile/api/profileApiSlice.ts` — RTK Query endpoints for `users`, `clientProfiles`, `trainerProfiles`.
  - `features/profile/api/profileApiTypes.ts`
- Hooks
  - `features/profile/hooks/useMyProfile.ts` — global "current user" hook (read).
  - `features/profile/hooks/client-profile/useClientProfile.ts`
  - `features/profile/hooks/trainer-profile/useTrainerProfile.ts`
- Screens
  - `features/profile/screens/TrainerProfileScreen.tsx`
  - `features/profile/screens/ClientProfileScreen.tsx`
- Components
  - `features/profile/components/client-profile/*` (BasicInfoCard, BodyMetricsCard, PreferencesCard)
  - `features/profile/components/trainer-profile/*` (BrandCard, FormCard)
  - `shared/ui/components/ProfileAccountCard.tsx` — shared "Account" section (sign out, language, etc.)
  - `shared/ui/components/ImagePickerField.tsx` — reusable image picker.
- Store
  - `features/profile/store/profileSlice.ts` — Redux slice for `currentUser`, `clientProfile`, `trainerProfile`.
- Types & utils
  - `features/profile/types/profile.ts` — `UserRow`, `ClientProfile`, `TrainerProfile`.
  - `features/profile/utils/formatDate.ts`, `units.ts`, `trainerProfileUtils.ts`.
- Routes
  - `app/(trainer)/(tabs)/profile.tsx`
  - `app/(client)/(tabs)/profile.tsx`

## Components

- `ClientBasicInfoCard` — phone, nationality, gender, birthDate.
- `ClientBodyMetricsCard` — heightCm, weightKg (with unit conversion display).
- `ClientPreferencesCard` — target, activityLevel, unitSystem (`metric|imperial`), notes.
- `TrainerBrandCard` — brandName, primary/secondary color (`ColorPickerField`), logo (`ImagePickerField`).
- `TrainerFormCard` — bio, certifications, instagram, website, phone.
- `ProfileAccountCard` — language switch, sign out, app version.

## Hooks

- `useMyProfile()` — orchestrates `getCurrentUser`, `getClientProfile`, `getTrainerProfile`. Syncs to Redux. Exposes `refetch` for pull-to-refresh.
- `useClientProfile()` / `useTrainerProfile()` — focused getters/setters for the role-specific screens.

## State Management

- Redux `profile` slice mirrors what's loaded so other features (theming, header avatar, brand styling) can read synchronously.
- RTK Query owns the cache; the slice is a derived projection updated in `useMyProfile`'s sync logic.

## API / Supabase Dependencies

### Tables
- `users` — `firstName`, `lastName`, `avatarUrl`, `email`, `role`, `roleConfirmed`.
- `clientProfiles` — keyed by `userId`. RLS: own row + linked-trainer read.
- `trainerProfiles` — keyed by `userId`. RLS: own row + linked-client read.

### Storage
- `avatars` (public) — folder `<auth.uid()>/avatar.jpg`. RLS allows owner write, public read.
- `logos` (public) — same pattern, used for trainer brand logo.

### Triggers
- `trg_users_updated_at` — bumps `updatedAt`.
- `trg_users_prevent_role_change_if_confirmed` — blocks role changes after confirmation.
- `trg_create_trainer_profile_on_role_change` — creates `trainerProfiles` row on role flip.

## Validation Rules

- `firstName/lastName`: required, trimmed.
- `email`: read-only (managed by Supabase Auth).
- `phone`: optional, validated by `PhoneInput`.
- Trainer brand colors: hex strings (`#RRGGBB`); used by `ThemeProvider` to override `accent`/`accent2`.
- Client metrics: positive numbers; conversion handled in `units.ts`.

## UI / UX Rules

- One card per logical section; never one giant form.
- Save buttons per section (so users don't save the whole world by accident).
- Use `appToast.success` after saves.
- Brand color changes apply live via the theme; preview uses the same accent.
- Both trainer and client profile screens use a modern layered layout with account card, focused section cards, and a clear bottom action row for save/sign-out.
- Account and section cards use bordered `surface2` styling for stronger visual grouping and readability on dark theme.
- The client birth-date selector button uses left content padding so its text aligns with other form fields.
- Profile screens now rely on shared `KeyboardScreen` horizontal spacing (instead of per-screen wrapper padding) so spacing stays consistent with the app-wide screen gutter.

## iOS + Android Notes

- Image picker requires permissions — request just-in-time.
- Date picker (birthDate) — use platform-appropriate component.
- Language switch should call `applyRtlIfNeeded(lang)` and may require an app restart for full RTL effect on Android (use a snackbar to inform).

## SOLID / Architecture Notes

- Each card is a self-contained editor with its own mutation; the screen is composition-only.
- `useMyProfile` is the single entry point for "current user" — never call the underlying RTK Query hooks directly outside `features/profile/`.
- Theming reads from the Redux `profile` slice; profile mutations propagate automatically through the slice.

## Performance Notes

- `useMyProfile` cache is shared across the app — header avatar, brand theme, dashboard greeting, and others read it for free.
- Image upload compresses to a small JPEG before write (`pickAndPrepareSquareImage`) — keep it.
- Color picker uses Reanimated for smooth swatch swap.

## Known Issues

- No unit tests for `units.ts` conversions.
- The trainer's `certifications` is a single text field — would be better as an array.
- No avatar/logo cropping UX beyond square preset.
- `clientProfiles` does not have a `nutritionPreferences` field — captured only in the free-form `notes` for now.

## Last Updated

2026-05-04 — profile redesign follow-up: removed top overview section, fixed birth-date field left padding, and moved to shared app-wide screen gutter spacing.
