import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import type { WorkoutSeries } from "../types";
import { ExerciseCard } from "./ExerciseCard";

import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Text, useTheme } from "@/shared/ui";

type Props = {
  series: WorkoutSeries;
  onEditExercise: (exerciseId: string) => void;
  onAddExercise: (seriesId: string) => void;
};

export function SeriesPage({ series, onEditExercise, onAddExercise }: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const maxHeight = screenHeight - 180;

  return (
    <>
      <View
        style={[
          styles.page,
          {
            backgroundColor: theme.colors.surface2,
            maxHeight,
          },
        ]}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={[
              hexToRgba(theme.colors.accent, 0.1),
              hexToRgba(theme.colors.accent2, 0.05),
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.headerContent}>
            <View
              style={[
                styles.seriesBadge,
                {
                  backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                  borderColor: hexToRgba(theme.colors.accent, 0.25),
                },
              ]}
            >
              <Text
                weight="bold"
                style={{ fontSize: 14, color: theme.colors.accent }}
              >
                {series.label}
              </Text>
            </View>
            <Text
              weight="semibold"
              style={{ fontSize: 14, color: theme.colors.text, marginLeft: 10 }}
            >
              {series.exercises.length}{" "}
              {series.exercises.length === 1
                ? t("builder.workoutBuilder.exerciseCount_one")
                : t("builder.workoutBuilder.exerciseCount_other")}
            </Text>
          </View>
        </View>

        <View style={styles.scrollContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {series.exercises.map((ex, idx) => {
              const code = `${series.label}${idx + 1}`;

              return (
                <ExerciseCard
                  key={ex.id}
                  code={code}
                  exercise={ex}
                  onEdit={() => onEditExercise(ex.id)}
                />
              );
            })}

            <View style={{ height: 12 }} />

            <Button
              variant="secondary"
              fullWidth
              onPress={() => onAddExercise(series.id)}
            >
              {t("builder.workoutBuilder.addExercise")}
            </Button>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        <LinearGradient
          colors={[
            "transparent",
            hexToRgba(theme.colors.background, 0.3),
            hexToRgba(theme.colors.background, 0.7),
            theme.colors.background,
          ]}
          locations={[0, 0.4, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </View>

    </>
  );
}

export function AddSeriesCard({ onPress }: { onPress: () => void }) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.addCard,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: hexToRgba(theme.colors.accent, 0.15),
        },
      ]}
    >
      <LinearGradient
        colors={[
          hexToRgba(theme.colors.accent, 0.1),
          hexToRgba(theme.colors.accent2, 0.05),
          "transparent",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.addCardContent}>
        <Button variant="secondary" fullWidth onPress={onPress}>
          {t("builder.workoutBuilder.addSeries")}
        </Button>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  page: {
    borderRadius: 20,
    borderWidth: 0,
    overflow: "hidden",
    flex: 1,
    position: "relative",
  },
  header: {
    padding: 12,
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  headerContent: {
    position: "relative",
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  seriesBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  addCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    position: "relative",
    overflow: "hidden",
  },
  addCardContent: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    alignItems: "center",
  },
});
