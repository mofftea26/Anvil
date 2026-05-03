# Frontend Documentation

The Anvil frontend is a **React Native + Expo SDK 54** app shared by trainers and clients, with **expo-router** for navigation and **Supabase** for backend access.

Read these in order if you are new to the codebase:

1. [tech-stack.md](./tech-stack.md) — every dependency and what it does here.
2. [folder-structure.md](./folder-structure.md) — how the repo is laid out.
3. [architecture.md](./architecture.md) — the rules and patterns you must follow.
4. [navigation.md](./navigation.md) — Expo Router groups and the role-based redirect.
5. [state-management.md](./state-management.md) — Redux + RTK Query model.
6. [api-layer.md](./api-layer.md) — how features talk to Supabase.
7. [theme-and-ui.md](./theme-and-ui.md) — design tokens, primitives, brand theming.
8. [animations.md](./animations.md) — Reanimated guidelines.
9. [performance.md](./performance.md) — list, render, and caching rules.
10. [testing.md](./testing.md) — current testing posture.
11. [platform-notes-ios-android.md](./platform-notes-ios-android.md) — iOS/Android parity notes.

Then dive into a specific feature in [`./features/`](./features/).
