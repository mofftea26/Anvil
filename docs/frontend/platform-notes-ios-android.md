# Platform Notes (iOS & Android)

Anvil ships from a single Expo codebase and must look and feel native on both platforms.

## App configuration (`app.json`)

| Field                               | Value                                  | Notes                                                                       |
| ----------------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| `name` / `slug`                     | `anvil`                                |                                                                             |
| `scheme`                            | `anvil`                                | Used by deep links.                                                         |
| `version`                           | `1.0.0`                                |                                                                             |
| `userInterfaceStyle`                | `automatic`                            | But the app is dark-only — system can't lighten it.                         |
| `newArchEnabled`                    | `true`                                 | Fabric + TurboModules.                                                      |
| `experiments.typedRoutes`           | `true`                                 | Generates `.expo/types/router.d.ts`.                                        |
| `experiments.reactCompiler`         | `true`                                 | Auto-memoization. Don't fight it with manual `useMemo` everywhere.          |

### iOS

- `bundleIdentifier`: `com.dancho26.anvil`.
- `supportsTablet`: `true`.
- `infoPlist.ITSAppUsesNonExemptEncryption`: `false` — required for App Store review.
- App icon: `assets/images/icon.png`.

### Android

- `package`: `com.dancho26.anvil`.
- `edgeToEdgeEnabled`: `true` — content draws under system bars; respect safe areas everywhere.
- `predictiveBackGestureEnabled`: `false` — opt out of Android 14 predictive back to keep custom navigation transitions correct.
- Adaptive icon: `assets/images/android-icon-foreground.png` + `…-background.png` + `…-monochrome.png`. Background color `#E6F4FE`.

## Splash screen

`expo-splash-screen` plugin in `app.json`:

- Image: `assets/images/splash-icon.png`, width 200, `contain`.
- Background: `#ffffff` (light) / `#000000` (dark).

`useFonts` blocks UI until Inter loads, so the splash stays up briefly while fonts initialize.

## Safe areas

- `<SafeAreaProvider />` and `<SafeAreaView edges={["top","bottom"]} />` wrap the navigator at the root (`app/_layout.tsx`).
- For modals or screens with custom backgrounds, use `useSafeAreaInsets()` instead of nesting another `SafeAreaView`.
- Android edge-to-edge means you **must** account for the gesture bar at the bottom and status bar at the top.

## Keyboard

- Use `<KeyboardScreen />` (`@/shared/ui`) for any screen with text inputs. It pairs `KeyboardAvoidingView` (iOS: padding, Android: height) with safe-area handling.
- Don't set `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` manually in feature code — use the primitive.
- For bottom sheets with text inputs, ensure focus scrolls the field above the keyboard.

## Permissions

Currently used:

| Permission                     | Library                  | Triggered by                                                          |
| ------------------------------ | ------------------------ | --------------------------------------------------------------------- |
| Photo library                  | `expo-image-picker`      | `pickAndPrepareSquareImage` (avatars, logos, exercise images).         |
| Camera                         | `expo-camera`            | Installed but not yet wired to a screen. **Needs verification**.       |
| Notifications                  | not installed yet        | Notifications feature is not implemented.                              |

Always request permission **just-in-time** (right before the action). On Android 13+ you must also ask for `READ_MEDIA_IMAGES` — `expo-image-picker` handles this for you, but verify on a real device.

## Status bar

- `expo-status-bar` style is set to `light` inside `<ThemeProvider />`. Don't override per-screen unless absolutely necessary.

## Haptics

- Use `expo-haptics` sparingly for confirmations (`Haptics.selectionAsync`, `Haptics.notificationAsync`).
- Don't haptic-fire inside scroll handlers — it's distracting.

## Linking & deep links

- Scheme: `anvil`. Used for auth callbacks (PKCE and magic link).
- See `useAuthBootstrap` for the URL handler.
- Configure `anvil://` and `exp://` in Supabase Auth → URL Configuration.

## Native folders

`/ios` and `/android` are gitignored. Builds are produced via EAS:

```bash
pnpm build:android:dev     # development client (.apk)
pnpm build:android:preview # internal QA (.apk)
pnpm build:ios:dev         # development client
pnpm build:ios:preview     # internal QA
```

If you need to run with custom native modules locally, run `npx expo prebuild` to generate the folders (don't commit them).

## Known platform gotchas

- **Android**: dropping back into the app after a long sleep can trigger a Reanimated warning about a missing layout. Reanimated 4 handles most of these, but watch the console.
- **Android edge-to-edge**: any custom modal must paint `theme.colors.background` to the system insets, or the bottom bar will show through.
- **iOS**: the workout-runner screen should disable the dim/auto-lock during a session. Currently `expo-keep-awake` is **not installed** — tracked as tech debt if you want to add it.
- **iOS PKCE deep link**: if Safari opens the magic-link URL and the app is not installed, the user gets a fallback page. Make sure your Universal Links configuration matches `anvil://` for production.

## Web (secondary)

`web` is enabled (`expo start --web`) and `react-native-web` is installed. The current UI was not designed for web — touch gestures, animations, and bottom sheets need verification before any web release.
