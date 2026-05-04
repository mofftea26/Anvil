# Theme & UI

Anvil ships a dark-only design system with brand-aware accent overrides per trainer.

## Tokens (`/shared/ui/theme/tokens.ts`)

```ts
export const darkTheme: AppTheme = {
  colors: {
    background: "#0B0D10",
    surface:    "#11151B",
    surface2:   "#161C24",
    surface3:   "#1E242E",
    text:       "#E7EAF0",
    textMuted:  "#AAB3C2",
    border:     "rgba(255,255,255,0.10)",
    accent:     "#A3FF12",   // Anvil green; overridden by trainer.primaryColor
    accent2:    "#22D3EE",   // Anvil cyan;  overridden by trainer.secondaryColor
    danger:     "#FF4D4D",
  },
  spacing: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32 },
  radii:   { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  typography: {
    fontFamilyRegular:  "Inter_400Regular",
    fontFamilySemiBold: "Inter_600SemiBold",
    fontFamilyBold:     "Inter_700Bold",
    fontSizeCaption: 13,
    fontSizeBody:    15,
    fontSizeTitle:   22,
    lineHeightBody:  22,
  },
};
```

Rules:

- **Never hardcode a color, spacing, or radius** in a feature file. Always read from `useTheme()`.
- New tokens are added here first, then consumed.
- `danger` stays for destructive/error UI. Don't repurpose it.

## Brand-aware `ThemeProvider`

`/shared/ui/theme/ThemeProvider.tsx` reads:

- `auth.userId` and `auth.role` from the Redux `auth` slice.
- For **trainers**: `useGetTrainerProfileQuery(userId)` → if `primaryColor` / `secondaryColor` are valid hex, they replace `accent` / `accent2` in the theme.
- For **clients**: `useGetMyCoachQuery({ clientId: userId })` → uses the linked trainer's `trainerProfile.primaryColor` / `secondaryColor`.

This means the UI adopts the coach's brand seamlessly for that client. If no brand is set, the default Anvil green/cyan is used.

`<StatusBar style="light" />` is mounted inside `ThemeProvider` to match the dark surface.

## UI primitives (`/shared/ui/index.ts`)

Re-exports include:

- **Layout**: `KeyboardScreen`, `HStack`, `VStack`, `TabBackgroundGradient`, `StickyHeader` (+ `useStickyHeaderHeight`).
- **Layout helpers**: `getScreenHorizontalPadding(theme)` for a single app-wide horizontal screen gutter.
- **Inputs**: `Input` (+ `InputProps`), `BottomSheetPicker` (+ `BottomSheetOption`, `BottomSheetPickerProps`), `ColorPickerField`, `ImagePickerField`.
- **Buttons**: `Button` (+ `ButtonProps`), `IconButton` (+ `IconButtonProps`).
- **Display**: `Card`, `Chip`, `Divider`, `Text`, `Icon`, `LoadingSpinner`, `ProgressBar`, `DurationCircle`, `AnimatedArrow`, `ExerciseLibraryCard`, `ProfileAccountCard`.
- **Feedback**: `appToast` (programmatic), `<ToastProvider />` (mount once), `AppAlertProvider` + `useAppAlert`.
- **Time-aware boards**: `TimelineBoard` (+ `TimelineBoardProps`, `TimelineDay`, `TimelineItem`) — generic vertical hour-grid timeline with horizontal day pills, month/year picker, and draggable items. Used by both the workouts schedule (`ClientScheduleScreen`) and the upcoming trainer check-ins screen. The `renderItemContent` prop lets callers swap the inner card layout without re-implementing the drag/preview logic; `bottomHintText` renders an optional muted footer string.
- **Theme**: `ThemeProvider`, `useTheme`, `darkTheme`.

Always import from `@/shared/ui` (the barrel) — never reach into individual files.

## Shared layout components (`/shared/components/`)

- `AppErrorBoundary` — render-tree crash catcher; wrap content trees that may throw.
- `AppInput`, `PhoneInput` — themed wrappers around RN `TextInput`.
- `BottomSheetPicker` — older-style sheet (newer one in `shared/ui/components`). **Needs verification** which is canonical; treat the `shared/ui` version as preferred.
- `FullscreenState` — splash-style state with title, subtitle, optional `progress`.
- `KeyboardScreen` — alias for the UI primitive; available here for legacy imports.

## Toast & alert APIs

```ts
import { appToast, useAppAlert } from "@/shared/ui";

// One-liner notifications:
appToast.success(t("toast.profileSaved"));
appToast.error(message);
appToast.info(text);

// Inline confirmations:
const alert = useAppAlert();
const confirmed = await alert.confirm({
  title: t("client.removeTitle"),
  message: t("client.removeMessage"),
  danger: true,
  confirmLabel: t("actions.remove"),
});
```

## Typography

- Use the `Text` primitive from `@/shared/ui` — it knows the font families and default colors.
- Don't use raw `<Text />` from `react-native` in feature code unless you explicitly need it (e.g. inside another themed wrapper).

## Spacing & layout

- Use `theme.spacing.{xs, sm, md, lg, xl, xxl}` exclusively.
- Use `<HStack gap={theme.spacing.md} />` and `<VStack gap={theme.spacing.md} />` to compose flex layouts cleanly.
- Use `<KeyboardScreen />` for any screen with a text input — it handles `KeyboardAvoidingView`, scrolling, and safe-area inset.
- Use `getScreenHorizontalPadding(theme)` for screen-level horizontal gutters (default = `theme.spacing.sm`) instead of hardcoded per-screen values.

## Iconography

`Icon` reads icon names through `iconMapping.ts` (`/shared/ui/utils/iconMapping.ts`). It composes `@hugeicons/react-native` and `@expo/vector-icons` so that one logical name can resolve to whichever pack ships the right glyph. Always use `<Icon name="…" />` rather than importing icon packs directly.

## Localization & UI

- All visible strings come from `useAppTranslation()`.
- For RTL languages (Arabic), `applyRtlIfNeeded(defaultLanguage)` runs at boot. After language change to/from `ar`, the app must reload — there is currently no in-app language switcher, but if you add one, document the reload mechanism here.

## Accessibility

- Touch targets ≥ 44pt where possible (`tabBarStyle.height: 74`, button `minHeight`).
- Color contrast: dark surfaces with `text: #E7EAF0` and `textMuted: #AAB3C2`.
- Reanimated worklets keep gestures responsive.
- Currently no explicit `accessibilityLabel` audit — improvement opportunity, tracked in `/docs/decisions/technical-debt.md`.
