# Animations

Anvil uses **react-native-reanimated 4** with **react-native-worklets** and **react-native-gesture-handler** for animations.

## Setup

- `babel.config.js` — `react-native-reanimated/plugin` is the **last** plugin entry. Do not move it.
- `app/_layout.tsx` imports `react-native-reanimated` at the top so the runtime is initialized before any screen mounts.
- The New Architecture is enabled (`newArchEnabled: true`), so Reanimated runs natively.

## Where animations live today

| Component                                   | Behavior                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `shared/ui/components/AnimatedArrow.tsx`    | Bouncing/sliding chevron used in CTAs.                                   |
| `shared/ui/components/BottomSheetPicker.tsx`| Custom Reanimated bottom sheet (no external sheet lib).                  |
| `shared/ui/components/DurationCircle.tsx`   | Animated progress ring for workout duration.                             |
| `shared/ui/components/ProgressBar.tsx`      | Smooth horizontal progress.                                              |
| `shared/ui/components/StickyHeader.tsx`     | Scroll-driven header.                                                    |
| `features/workouts/components/run/*`        | Workout-runner transitions (set ↔ rest, completion).                     |

## Guidelines

- Drive animations with `useSharedValue` + `useAnimatedStyle`. Avoid `Animated` from `react-native` for new code.
- Wrap gesture callbacks with `react-native-gesture-handler`'s modern `Gesture` API; do not import the deprecated `PanGestureHandler`.
- Keep heavy work inside worklets; bounce expensive results back via `runOnJS` only when needed.
- Always test on Android — that's where dropped frames are most visible. On iOS the GPU usually masks issues.
- Don't animate layout that changes list height while scrolling. Animate transforms (translate/scale/opacity) instead.
- For long-running animations, cancel them in cleanup (`cancelAnimation(sharedValue)` or `useEffect` return).

## Performance budget

- Target 60 fps (16 ms/frame) on a mid-range Android.
- If you need to debug perf, use Flipper's React Native Performance Monitor or `console.time` inside a worklet (`'worklet'; console.log(performance.now())`).

## Adding a new animation

1. Build it inside the feature folder if it's specific (e.g. `features/workouts/components/run/RestTimer.tsx`). Move it to `shared/ui/components/` once another feature needs it.
2. Document any non-trivial behavior in this file.
3. Confirm Android frame rate is acceptable.
4. Confirm gestures still work with the keyboard open and after RTL switch.

## Things to avoid

- ❌ Anchoring a worklet to component state via `setState` inside a worklet (use `runOnJS`).
- ❌ Using `react-native-animatable` or other legacy libs — not installed.
- ❌ Adding a new heavy animation library without an ADR.
