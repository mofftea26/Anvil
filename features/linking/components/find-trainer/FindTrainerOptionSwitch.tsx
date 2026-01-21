import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text, useTheme } from "@/shared/ui";

export type FindTrainerMode = "email" | "redeem";

type FindTrainerOptionSwitchProps = {
  mode: FindTrainerMode;
  onModeChange: (mode: FindTrainerMode) => void;
  byEmailLabel: string;
  redeemCodeLabel: string;
};

export function FindTrainerOptionSwitch({
  mode,
  onModeChange,
  byEmailLabel,
  redeemCodeLabel,
}: FindTrainerOptionSwitchProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface2,
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 4,
        },
      ]}
    >
      <Pressable
        onPress={() => onModeChange("email")}
        style={[
          styles.segment,
          { borderRadius: 10 },
          mode === "email" && { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text
          weight={mode === "email" ? "semibold" : "regular"}
          style={{ color: mode === "email" ? theme.colors.text : theme.colors.textMuted }}
        >
          {byEmailLabel}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onModeChange("redeem")}
        style={[
          styles.segment,
          { borderRadius: 10 },
          mode === "redeem" && { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text
          weight={mode === "redeem" ? "semibold" : "regular"}
          style={{ color: mode === "redeem" ? theme.colors.text : theme.colors.textMuted }}
        >
          {redeemCodeLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
