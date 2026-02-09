import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { Icon, Text, useTheme } from "@/shared/ui";

export const WorkoutRunSetRow = memo(function WorkoutRunSetRow(props: {
  setNumber: number;
  reps: string;
  weight: string;
  completed: boolean;
  onChangeReps: (v: string) => void;
  onChangeWeight: (v: string) => void;
  onToggleCompleted: () => void;
}) {
  const theme = useTheme();

  const onToggle = useCallback(() => props.onToggleCompleted(), [props]);

  return (
    <View
      style={[
        styles.row,
        {
          borderColor: hexToRgba(theme.colors.textMuted, 0.14),
          backgroundColor: props.completed
            ? hexToRgba(theme.colors.accent, 0.12)
            : theme.colors.surface2,
        },
      ]}
    >
      <View style={styles.cellSet}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: "800" }}>
          {props.setNumber}
        </Text>
      </View>

      <TextInput
        value={props.reps}
        onChangeText={props.onChangeReps}
        placeholder="Reps"
        placeholderTextColor={hexToRgba(theme.colors.textMuted, 0.6)}
        keyboardType="numeric"
        style={[
          styles.input,
          { color: theme.colors.text, backgroundColor: theme.colors.background },
        ]}
      />

      <TextInput
        value={props.weight}
        onChangeText={props.onChangeWeight}
        placeholder="kg"
        placeholderTextColor={hexToRgba(theme.colors.textMuted, 0.6)}
        keyboardType="numeric"
        style={[
          styles.input,
          { color: theme.colors.text, backgroundColor: theme.colors.background },
        ]}
      />

      <Pressable onPress={onToggle} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
        <View
          style={[
            styles.check,
            {
              backgroundColor: props.completed
                ? theme.colors.accent
                : hexToRgba(theme.colors.textMuted, 0.18),
            },
          ]}
        >
          <Icon
            name="checkmark"
            size={16}
            color={props.completed ? theme.colors.background : theme.colors.textMuted}
            strokeWidth={2.5}
          />
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  cellSet: { width: 26, alignItems: "center" },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "700",
  },
  check: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

