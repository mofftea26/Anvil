import React from "react";
import { StyleSheet, View } from "react-native";

import { Text, useTheme } from "@/src/shared/ui";

export default function ExercisesScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Exercises</Text>
      <Text style={{ color: theme.colors.textMuted }}>
        Coming next: library list + filters + custom exercise creation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
});
