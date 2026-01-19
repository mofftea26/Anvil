import React from "react";
import { StyleSheet, View } from "react-native";

import { Text, useTheme } from "@/shared/ui";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

export default function ExercisesScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t("library.exercises")}
      </Text>
      <Text style={{ color: theme.colors.textMuted }}>
        {t("library.exercisesScreen.subtitle")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "700" },
});
