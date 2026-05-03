# Testing

## Status

There is **no automated test suite** in this repository at the time of writing.

- No `jest`, `jest-expo`, `@testing-library/react-native`, or `detox` in `package.json`.
- No `__tests__/`, `*.test.ts(x)`, or `*.spec.ts(x)` files.
- No `pnpm test` script.

This is tracked in [`/docs/decisions/technical-debt.md`](../decisions/technical-debt.md).

## Recommended baseline (when introducing tests)

If you add testing to the project, do it in this order:

1. **Unit tests for pure utilities** — `features/*/utils/*.ts`, `shared/utils/*.ts`. These are pure functions with no React deps. Use `vitest` or `jest` with `ts-jest`.
2. **Type tests for API mappers** — verify `toClientWorkoutAssignment`, `toTemplate`, `normalizeTrainerProfile` produce the expected shape.
3. **RTK Query tests** — pass a stub `supabase` and assert tag invalidation.
4. **Component tests** — `@testing-library/react-native` with `jest-expo` preset.
5. **End-to-end** — Detox or Maestro, only after the above are stable.

When you add the first test setup, document:

- Test runner (jest vs vitest).
- How to mock `supabase` (a fake client factory in `tests/utils/`).
- How to render with providers (`renderWithProviders` helper around `Provider`, `ThemeProvider`, `AppAlertProvider`, `ToastProvider`).
- CI integration (EAS or GitHub Actions).

## Manual smoke tests (current baseline)

Until automation lands, every PR should be smoke-tested on:

- iOS simulator + a recent physical iOS device,
- Android emulator + a recent physical Android device.

Cover at minimum:

- Sign up → onboarding → role selection → tabs.
- Sign out and sign back in (deep link / magic link if available).
- Trainer creates a program template and a workout, assigns to a client.
- Client opens "Workouts" tab, runs a workout, completes it.
- Profile editing on both sides.
- Switch language to Arabic and confirm RTL layout.

## Lint & types

- `pnpm lint` runs `expo lint` (ESLint flat config + Expo preset).
- `tsc --noEmit` is **not** in `package.json` scripts. Add it when you add CI:
  ```bash
  pnpm exec tsc --noEmit
  ```
- The repo has an `eslint-report.txt` at the root. **Needs verification** whether it's auto-generated or stale; remove or document accordingly.
