import React, { useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { Icon } from "./Icon";
import { useTheme } from "../theme";

type AnimatedArrowProps = {
  direction: "left" | "right";
  delay?: number;
};

export function AnimatedArrow({ direction, delay = 0 }: AnimatedArrowProps) {
  const theme = useTheme();
  const opacity = useState(new Animated.Value(0.3))[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity]);

  return (
    <Animated.View style={[styles.arrowContainer, { opacity }]}>
      <Icon
        name={direction === "right" ? "chevron-forward" : "chevron-back"}
        size={20}
        color={theme.colors.accent}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  arrowContainer: {
    padding: 2,
  },
});
