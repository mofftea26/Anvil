import React from "react";
import type { PressableProps } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

type Props = PressableProps & {
  label: string;
  isActive: boolean;
  /** Optional left element (e.g. Icon for difficulty). */
  left?: React.ReactNode;
  /** When isActive, use these instead of theme accent (e.g. difficulty colors). */
  activeBackgroundColor?: string;
  activeBorderColor?: string;
  activeLabelColor?: string;
};

export function Chip({
  label,
  left,
  style,
  isActive,
  activeBackgroundColor,
  activeBorderColor,
  activeLabelColor,
  ...props
}: Props) {
  const theme = useTheme();
  const bg = isActive
    ? activeBackgroundColor ?? theme.colors.accent
    : theme.colors.surface2;
  const border = isActive
    ? activeBorderColor ?? theme.colors.border
    : theme.colors.border;
  const labelColor =
    isActive && activeLabelColor != null ? activeLabelColor : undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: pressed ? 0.85 : 1,
        },
        style as any,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {left != null ? <View style={styles.left}>{left}</View> : null}
        <Text
          variant="caption"
          weight="semibold"
          style={labelColor != null ? { color: labelColor } : undefined}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  left: {},
});
