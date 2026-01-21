import React from "react";
import { StyleSheet, View } from "react-native";

import { Text, useTheme } from "@/shared/ui";

type LibraryPlaceholderViewProps = {
  title: string;
  subtitle: string;
};

export function LibraryPlaceholderView({ title, subtitle }: LibraryPlaceholderViewProps) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={{ color: theme.colors.textMuted }}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
});
