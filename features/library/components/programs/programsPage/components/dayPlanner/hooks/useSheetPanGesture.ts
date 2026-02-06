import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const SWIPE_CLOSE_THRESHOLD = 60;

export function useSheetPanGesture(params: {
  onClose: () => void;
  sheetTranslateY: any; // SharedValue<number>
}) {
  const { onClose, sheetTranslateY } = params;

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(5)
        .onUpdate((e) => {
          if (e.translationY > 0) sheetTranslateY.value = e.translationY;
        })
        .onEnd(() => {
          const ty = sheetTranslateY.value;
          if (ty > SWIPE_CLOSE_THRESHOLD) {
            sheetTranslateY.value = withTiming(400, { duration: 150 }, () => {
              scheduleOnRN(onClose);
            });
          } else {
            sheetTranslateY.value = withSpring(0, {
              damping: 20,
              stiffness: 300,
            });
          }
        }),
    [onClose, sheetTranslateY]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return { gesture, animatedStyle };
}
