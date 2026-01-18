import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import { Text, useTheme } from "../../../src/shared/ui";

export default function TrainerLibraryScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 6 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t("library.title", "Library")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {t(
              "library.subtitle",
              "Create & manage Programs, Workouts, and Exercises."
            )}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={[styles.row, { gap: theme.spacing.md }]}>
          <Pressable
            onPress={() => router.push("/(trainer)/library/create-program")}
            style={[
              styles.quickBtn,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={theme.colors.accent}
            />
            <Text style={{ color: theme.colors.text, fontSize: 13 }}>
              {t("library.createProgram", "New Program")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(trainer)/library/workout-builder/new")}
            style={[
              styles.quickBtn,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={theme.colors.accent2}
            />
            <Text style={{ color: theme.colors.text, fontSize: 13 }}>
              {t("library.createWorkout", "New Workout")}
            </Text>
          </Pressable>
        </View>

        <LibraryCard
          title={t("library.programs", "Programs")}
          subtitle={t("library.programsDesc", "Templates with phases + weekly days")}
          icon="calendar-outline"
          onPress={() => router.push("/(trainer)/library/programs")}
        />

        <LibraryCard
          title={t("library.workouts", "Workouts")}
          subtitle={t("library.workoutsDesc", "Poliquin blocks A/B/C with sets")}
          icon="barbell-outline"
          onPress={() => router.push("/(trainer)/library/workouts")}
        />

        <LibraryCard
          title={t("library.exercises", "Exercises")}
          subtitle={t("library.exercisesDesc", "Stock + your custom exercises")}
          icon="list-outline"
          onPress={() => router.push("/(trainer)/library/exercises")}
        />

        <LibraryCard
          title={t("library.setTypes", "Set Types Dictionary")}
          subtitle={t("library.setTypesDesc", "Warm-up, Drop sets, Density…")}
          icon="book-outline"
          onPress={() => router.push("/(trainer)/library/set-types")}
        />
      </ScrollView>
    </View>
  );
}

function LibraryCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.colors.text} />
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 16 }}>
            {title}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 }}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 13 },
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
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
