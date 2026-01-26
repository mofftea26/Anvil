import React from "react";
import { ScrollView, View } from "react-native";

import { LibraryCard } from "@/features/library/components/library-home/LibraryCard";
import { LibraryQuickActions } from "@/features/library/components/library-home/LibraryQuickActions";
import { useLibraryHome } from "@/features/library/hooks/library-home/useLibraryHome";
import { StickyHeader, TabBackgroundGradient, useTheme } from "@/shared/ui";

export default function LibraryHomeScreen() {
  const theme = useTheme();
  const {
    t,
    onNewProgram,
    onNewWorkout,
    onPrograms,
    onWorkouts,
    onExercises,
    onSetTypes,
  } = useLibraryHome();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("library.title", "Library")}
        subtitle={t(
          "library.subtitle",
          "Create & manage Programs, Workouts, and Exercises."
        )}
      />
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <LibraryQuickActions
          onNewProgram={onNewProgram}
          onNewWorkout={onNewWorkout}
          newProgramLabel={t("library.newProgram", "New Program")}
          newWorkoutLabel={t("library.createWorkout", "New Workout")}
        />

        <LibraryCard
          title={t("library.programs", "Programs")}
          subtitle={t("library.programsDesc", "Templates with phases + weekly days")}
          icon="calendar-outline"
          onPress={onPrograms}
        />

        <LibraryCard
          title={t("library.workouts", "Workouts")}
          subtitle={t("library.workoutsDesc")}
          icon="barbell-outline"
          onPress={onWorkouts}
        />

        <LibraryCard
          title={t("library.exercises", "Exercises")}
          subtitle={t("library.exercisesDesc", "Stock + your custom exercises")}
          icon="list-outline"
          onPress={onExercises}
        />

        <LibraryCard
          title={t("library.setTypes", "Set Types Dictionary")}
          subtitle={t("library.setTypesDesc", "Warm-up, Drop sets, Density…")}
          icon="book-outline"
          onPress={onSetTypes}
        />
      </ScrollView>
    </View>
  );
}
