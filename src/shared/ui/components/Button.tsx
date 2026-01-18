import React from "react";
import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "icon";

export type ButtonProps = PressableProps & {
  children?: React.ReactNode;
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
  const isIcon = variant === "icon";

  const backgroundColor = (() => {
    if (isIcon) return "transparent";
    if (variant === "primary") return theme.colors.accent;
    if (variant === "secondary") return theme.colors.surface;
    if (variant === "ghost") return "transparent";
    if (variant === "icon") return "transparent";
    return "transparent";
  })();

  const borderColor =
    variant === "secondary" ? theme.colors.border : "transparent";

  const textColor =
    variant === "primary" ? theme.colors.background : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,

        isIcon && styles.iconBase,

        {
          height,
          width: isIcon ? height : fullWidth ? "100%" : undefined,
          backgroundColor,
          borderColor: isIcon ? "transparent" : borderColor,
          opacity: pressed ? 0.85 : 1,
        },

        isDisabled && { opacity: 0.5 },
        style as any,
      ]}
      {...props}
    >
      <View
        style={[styles.content, isIcon && styles.iconContent, contentStyle]}
      >
        {isIcon ? (
          isLoading ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            left ?? children
          )
        ) : (
          <>
            {left ? <View style={styles.left}>{left}</View> : null}

            {isLoading ? (
              <ActivityIndicator color={textColor} />
            ) : (
              <Text weight="semibold" style={[{ color: textColor }, textStyle]}>
                {children}
              </Text>
            )}

            {right ? <View style={styles.right}>{right}</View> : null}
          </>
        )}
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

  iconBase: {
    borderWidth: 0,
    borderRadius: 999,
  },

  content: {
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },

  iconContent: {
    paddingHorizontal: 0,
  },

  left: { marginRight: 8 },
  right: { marginLeft: 8 },
});
