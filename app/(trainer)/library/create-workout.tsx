import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../src/shared/ui";
import { Text } from "../../../src/shared/ui/components/Text";

export default function CreateWorkoutScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Create Workout
      </Text>
      <Text style={{ color: theme.colors.textMuted }}>
        Next step: Blocks A/B/C → Add exercises → Add sets.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
});
