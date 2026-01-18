import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme";

type Props = {
  progress: number; // 0..1
};

export function ProgressBar({ progress }: Props) {
  const theme = useTheme();
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border },
      ]}
    >
      <View
        style={[
          styles.fill,
          { width: `${Math.round(p * 100)}%`, backgroundColor: theme.colors.accent },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});

