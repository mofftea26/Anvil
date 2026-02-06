import React from "react";
import { View } from "react-native";
import {
  createAnimatedComponent,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedView = createAnimatedComponent(View);

export function WeekPillWithOffset(props: {
  index: number;
  fromIndexShared: any; // SharedValue<number>
  toIndexShared: any; // SharedValue<number>
  slotWidth: number;
  onLayout?: (e: any) => void;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const from = props.fromIndexShared.value;
    const to = props.toIndexShared.value;
    if (from < 0 || to < 0 || from === to)
      return { transform: [{ translateX: 0 }] };

    let offset = 0;
    if (to < from && props.index >= to && props.index < from)
      offset = props.slotWidth;
    if (to > from && props.index > from && props.index <= to)
      offset = -props.slotWidth;
    return {
      transform: [
        { translateX: withSpring(offset, { damping: 20, stiffness: 260 }) },
      ],
    };
  });

  return (
    <AnimatedView onLayout={props.onLayout} style={style}>
      {props.children}
    </AnimatedView>
  );
}
