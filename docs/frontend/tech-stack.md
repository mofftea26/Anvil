# Tech Stack

Source of truth: `package.json` and `app.json`. Update this doc when those change.

## Runtime

| Layer            | Choice                                              | Notes                                                                                              |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Framework        | **React Native 0.81.5** + **React 19.1**            | New Architecture (`newArchEnabled: true`). React Compiler is on (`experiments.reactCompiler`).     |
| App platform     | **Expo SDK ~54**                                    | Managed workflow. `/ios` and `/android` are not committed (gitignore).                             |
| Routing          | **expo-router ~6**                                  | File-based routing with `typedRoutes: true`.                                                       |
| Bundler          | Metro (Expo default) + `babel-preset-expo`          | `babel-plugin-module-resolver` for path aliases. `react-native-reanimated/plugin` is **last**.     |
| Lint             | **ESLint 9** with `eslint-config-expo` flat config  | `eslint-import-resolver-typescript` resolves `@/*` aliases.                                        |
| Type system      | **TypeScript 5.9** (`strict: true`)                 | Path aliases: `@/*`, `@/features/*`, `@/shared/*`, `@/store/*`, `@/types/*`.                       |
| Package manager  | **pnpm 9.15.9**                                     | `packageManager` field in `package.json`.                                                          |
| Build / OTA      | **EAS Build** (CLI ≥ 16.32.0, `appVersionSource: remote`) | Profiles: `development`, `preview`, `production`.                                              |

## State, Data & Forms

| Concern             | Choice                                  | Notes                                                                                |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Global state        | **Redux Toolkit 2** + **react-redux 9** | `store` in `/store/store.ts`. Slices: `auth`, `profile`. RTK Query API: `api`.       |
| Server state / cache| **RTK Query** (built into `@reduxjs/toolkit`) | One shared `api` instance with `injectEndpoints`. Tag-based invalidation.       |
| Backend client      | **`@supabase/supabase-js` v2**          | Singleton in `/shared/supabase/client.ts` with `AsyncStorage` + `processLock`.       |
| Local persistence   | `@react-native-async-storage/async-storage` and `expo-secure-store` | AsyncStorage for Supabase session and schedule-time overrides. SecureStore available for sensitive items. |
| Forms               | **react-hook-form 7** + `@hookform/resolvers` | Validate with **zod 4**.                                                       |
| Schemas             | **zod 4**                               | Used for sign-in/up forms and any shared validation.                                 |
| i18n                | **i18next 25** + **react-i18next 16**   | Languages: `en`, `fr`, `ar`. RTL handled in `applyRtlIfNeeded`.                      |
| Localization        | **expo-localization**                   | Detects device language at boot.                                                     |

## UI & UX

| Concern             | Choice                                              | Notes                                                                            |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| Theme               | Custom dark-only tokens in `/shared/ui/theme/tokens.ts` | `ThemeProvider` overlays trainer brand colors onto `accent` / `accent2`.    |
| Typography          | `@expo-google-fonts/inter`                          | `Inter_400Regular`, `_600SemiBold`, `_700Bold` loaded in `app/_layout.tsx`.      |
| Icons               | `@expo/vector-icons`, `@hugeicons/react-native`, `@hugeicons/core-free-icons` | Wrapped by `Icon` and `iconMapping.ts`.                              |
| Layout primitives   | `react-native-safe-area-context`, `KeyboardScreen`, `HStack/VStack` | Edge-to-edge enabled on Android.                                  |
| Animation           | `react-native-reanimated ~4.1.1` + `react-native-worklets` | Plugin must be the **last** Babel plugin.                                  |
| Gestures            | `react-native-gesture-handler ~2.28`                |                                                                                  |
| Bottom sheets       | Custom `BottomSheetPicker` (Reanimated)             | No `@gorhom/bottom-sheet` dependency.                                            |
| Toasts              | `toastify-react-native ^7.2.3`                      | Wrapped by `appToast` and `<ToastProvider />`.                                   |
| Alerts / confirmations | Custom `AppAlertProvider` + `useAppAlert`        | Themed replacement for `Alert.alert`.                                            |
| Splash & status     | `expo-splash-screen`, `expo-status-bar`, `expo-system-ui` | Splash configured in `app.json` plugin block.                              |
| Blur / gradient     | `expo-blur`, `expo-linear-gradient`                 |                                                                                  |
| Haptics             | `expo-haptics`                                      |                                                                                  |
| Symbols             | `expo-symbols`                                      | iOS SF Symbols when applicable.                                                  |

## Media

| Concern             | Choice                                              | Notes                                                                            |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| Images              | `expo-image ~3`                                     | Used everywhere for caching and perf.                                            |
| Image picking/manip | `expo-image-picker`, `expo-image-manipulator`       | See `/shared/media/imageUpload.ts` for the square-crop pipeline.                 |
| File system         | `expo-file-system` (legacy submodule used in `imageUpload.ts`) | Used to read file size for compression loop.                              |
| Camera              | `expo-camera`                                       | Available; not yet used by any feature screen.                                   |
| Video               | `expo-av`, `expo-video-thumbnails`                  | Custom `VideoPlayerModal` in `/features/builder/components/`.                    |
| QR codes            | `react-native-qrcode-svg` + `react-native-svg`      | Used in trainer linking flows.                                                   |
| Clipboard           | `expo-clipboard`                                    | Used in invite/code flows.                                                       |
| Browser             | `expo-web-browser`                                  |                                                                                  |
| Linking             | `expo-linking`                                      | Deep links (`anvil://`) for auth callbacks.                                      |

## Native Inputs

| Concern             | Choice                                              | Notes                                                                            |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| Date/time picker    | `@react-native-community/datetimepicker ^8.4`       |                                                                                  |
| Phone parsing       | `libphonenumber-js`                                 | Used by `PhoneInput`.                                                            |

## Constants

| Concern             | Choice                                              | Notes                                                                            |
| ------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| Encoding            | `base64-js`                                         | For storage uploads.                                                             |
| URL polyfill        | `react-native-url-polyfill/auto`                    | Required for `@supabase/supabase-js` on RN.                                      |
| Constants from app  | `expo-constants`                                    | Reads `extra.eas.projectId` and similar.                                         |

## Dev-only

`@types/react`, `babel-plugin-module-resolver`, `eslint`, `eslint-config-expo`, `eslint-import-resolver-typescript`, `typescript`.

## Things to know about the New Architecture

- The app runs on the New Architecture (`newArchEnabled: true`) — Fabric + TurboModules.
- React Compiler is enabled via `experiments.reactCompiler`. Don't blindly add `useMemo`/`useCallback` — the compiler handles many cases. Use them when you have measured a problem or when stability is required for an external memoized consumer.
- Reanimated 4 is installed. Always keep `react-native-reanimated/plugin` as the last entry in `babel.config.js`.
