import React from "react";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost";

export type ButtonProps = PressableProps & {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
  height?: number;
  left?: React.ReactNode;
  right?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  children,
  isLoading,
  disabled,
  variant = "primary",
  fullWidth,
  height = 48,
  left,
  right,
  style,
  contentStyle,
  textStyle,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = Boolean(disabled || isLoading);

  const bg =
    variant === "primary"
      ? theme.colors.accent
      : variant === "secondary"
        ? theme.colors.surface
        : "transparent";

  const borderColor = variant === "secondary" ? theme.colors.border : "transparent";
  const textColor = variant === "primary" ? theme.colors.background : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          width: fullWidth ? "100%" : undefined,
          backgroundColor: bg,
          borderColor,
          opacity: pressed ? 0.9 : 1,
        },
        isDisabled ? { opacity: 0.6 } : null,
        style as any,
      ]}
      {...props}
    >
      <View style={[styles.content, contentStyle]}>
        {left ? <View style={styles.left}>{left}</View> : null}

        {isLoading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text weight="semibold" style={[{ color: textColor }, textStyle]}>
            {children}
          </Text>
        )}

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  left: { marginRight: 8 },
  right: { marginLeft: 8 },
});

