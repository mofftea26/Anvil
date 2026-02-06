import { useEffect } from "react";
import {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function useSwipeHintAnimation(params: {
  visible: boolean;
  count: number;
  swipeHintOffset: any; // SharedValue<number>
}) {
  const { visible, count, swipeHintOffset } = params;

  useEffect(() => {
    if (!visible || count === 0) return;
    swipeHintOffset.value = 0;
    swipeHintOffset.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );
    return () => {
      swipeHintOffset.value = 0;
    };
  }, [visible, count, swipeHintOffset]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: swipeHintOffset.value }],
  }));
}
