import React from "react";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";

type Variant = "secondary" | "ghost";

export type IconButtonProps = PressableProps & {
  icon: React.ReactNode;
  variant?: Variant;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  variant = "secondary",
  size = 42,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const theme = useTheme();
  const isDisabled = Boolean(disabled);

  const bg = variant === "secondary" ? theme.colors.surface : "transparent";
  const borderColor = variant === "secondary" ? theme.colors.border : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          backgroundColor: bg,
          borderColor,
          opacity: pressed ? 0.9 : 1,
        },
        isDisabled ? { opacity: 0.6 } : null,
        style as any,
      ]}
      {...props}
    >
      <View style={styles.content}>{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
});

