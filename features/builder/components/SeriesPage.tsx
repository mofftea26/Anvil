import React from "react";
import { StyleSheet, View } from "react-native";

import type { WorkoutSeries } from "../types";
import { ExerciseCard } from "./ExerciseCard";

import { Button, Text, useTheme } from "@/src/shared/ui";

type Props = {
  series: WorkoutSeries;
  onEditExercise: (exerciseId: string) => void;
  onAddExercise: (seriesId: string) => void;
};

export function SeriesPage({ series, onEditExercise, onAddExercise }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.page,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Header (no + button anymore) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.seriesBadge,
              {
                backgroundColor: theme.colors.surface3,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={{ fontWeight: "900" }}>{series.label}</Text>
          </View>

          <View>
            <Text style={{ fontSize: 16, fontWeight: "900" }}>
              Series {series.label}
            </Text>
            <Text style={{ opacity: 0.7 }}>
              {series.exercises.length} exercises
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.list}>
        {series.exercises.map((ex, idx) => {
          const code = `${series.label}${idx + 1}`;

          return (
            <ExerciseCard
              key={ex.id}
              code={code}
              exercise={ex}
              onPress={() => onEditExercise(ex.id)}
            />
          );
        })}

        <View style={{ height: 6 }} />

        <Button
          variant="secondary"
          fullWidth
          onPress={() => onAddExercise(series.id)}
        >
          + Add Exercise
        </Button>
      </View>
    </View>
  );
}

export function AddSeriesCard({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.addCard,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Button variant="secondary" fullWidth onPress={onPress}>
        + Add Series
      </Button>

      <Text style={{ opacity: 0.75, marginTop: 10, textAlign: "center" }}>
        Swipe here to create a new series (A/B/C…)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
  },
  header: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  seriesBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 14,
    gap: 12,
    paddingBottom: 16,
  },
  addCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
});
