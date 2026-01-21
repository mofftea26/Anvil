import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text, useTheme } from "@/shared/ui";

type LibraryQuickActionsProps = {
  onNewProgram: () => void;
  onNewWorkout: () => void;
  newProgramLabel: string;
  newWorkoutLabel: string;
};

export function LibraryQuickActions({
  onNewProgram,
  onNewWorkout,
  newProgramLabel,
  newWorkoutLabel,
}: LibraryQuickActionsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { gap: theme.spacing.md }]}>
      <Pressable
        onPress={onNewProgram}
        style={[
          styles.quickBtn,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name="add-circle-outline" size={18} color={theme.colors.accent} />
        <Text style={{ color: theme.colors.text, fontSize: 13 }}>{newProgramLabel}</Text>
      </Pressable>

      <Pressable
        onPress={onNewWorkout}
        style={[
          styles.quickBtn,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name="add-circle-outline" size={18} color={theme.colors.accent2} />
        <Text style={{ color: theme.colors.text, fontSize: 13 }}>{newWorkoutLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
});
