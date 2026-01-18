import React from "react";
import type { PressableProps } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

type Props = PressableProps & {
  label: string;
  isActive: boolean;
};

export function Chip({ label, style, isActive, ...props }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isActive ? theme.colors.accent : theme.colors.surface2,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
        style as any,
      ]}
      {...props}
    >
      <View style={styles.content}>
        <Text variant="caption" weight="semibold">
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
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
