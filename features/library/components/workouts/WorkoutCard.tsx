import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { Card, DurationCircle, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

type WorkoutCardProps = {
  workout: WorkoutRow;
  updatedAtLabel: string;
  defaultTitle: string;
  onPress: () => void;
  onPressAssign?: () => void;
};

export function WorkoutCard({
  workout,
  updatedAtLabel,
  defaultTitle,
  onPress,
  onPressAssign,
}: WorkoutCardProps) {
  const theme = useTheme();
  const title = workout.title || defaultTitle;
  const updatedDate = formatShortDate(workout.updatedAt);

  const stats = useMemo(() => {
    try {
      const state = workout.state;
      if (!state?.series) return null;

      const totalSeries = state.series.length;
      const totalExercises = state.series.reduce(
        (sum, s) => sum + (s.exercises?.length || 0),
        0
      );
      const totalSets = state.series.reduce(
        (sum, s) =>
          sum +
          (s.exercises?.reduce(
            (eSum, e) => eSum + (e.sets?.length || 0),
            0
          ) || 0),
        0
      );

      return {
        series: totalSeries,
        exercises: totalExercises,
        sets: totalSets,
      };
    } catch {
      return null;
    }
  }, [workout.state]);

  const durationMinutes = useMemo(() => {
    try {
      const state = workout.state;
      if (!state?.series) return null;

      const totalMinutes = state.series.reduce(
        (sum, s) => sum + (s.durationMin ?? 0),
        0
      );

      return totalMinutes > 0 ? totalMinutes : null;
    } catch {
      return null;
    }
  }, [workout.state]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Card
        padded={false}
        style={[
          styles.card,
          {
            borderRadius: theme.radii.lg,
            borderColor: hexToRgba(theme.colors.accent, 0.15),
          },
        ]}
      >
        <View style={{ position: "relative", overflow: "hidden" }}>
          <LinearGradient
            colors={[
              hexToRgba(theme.colors.accent, 0.16),
              hexToRgba(theme.colors.accent2, 0.08),
              hexToRgba(theme.colors.accent, 0.04),
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Content */}
          <VStack style={[styles.content, { padding: theme.spacing.lg }]}>
            {/* Header Section */}
            <HStack align="flex-start" justify="space-between" style={styles.header}>
              <VStack style={{ flex: 1, gap: theme.spacing.xs }}>
                {/* Title */}
                <Text
                  weight="bold"
                  style={[
                    styles.title,
                    {
                      color: theme.colors.text,
                      fontSize: 20,
                      lineHeight: 26,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {title}
                </Text>

                {/* Updated Date */}
                <Text
                  muted
                  style={[
                    styles.dateText,
                    {
                      fontSize: 13,
                      color: theme.colors.textMuted,
                    },
                  ]}
                >
                  {updatedAtLabel} {updatedDate}
                </Text>
              </VStack>

              {/* Duration Badge - Prominent Circle */}
              <HStack align="center" gap={8}>
                {onPressAssign ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onPressAssign();
                    }}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.assignBtn,
                      {
                        backgroundColor: pressed
                          ? hexToRgba(theme.colors.accent, 0.18)
                          : hexToRgba(theme.colors.textMuted, 0.10),
                      },
                    ]}
                    accessibilityLabel="Assign to clients"
                  >
                    <Icon
                      name="people-outline"
                      size={18}
                      color={theme.colors.text}
                      strokeWidth={1.5}
                    />
                  </Pressable>
                ) : null}
                <DurationCircle minutes={durationMinutes} size="small" />
              </HStack>
            </HStack>

            {/* Stats Section - Modern Horizontal Layout */}
            {stats && (stats.series > 0 || stats.exercises > 0 || stats.sets > 0) ? (
              <View style={styles.statsContainer}>
                <HStack
                  align="center"
                  justify="flex-start"
                  gap={theme.spacing.md}
                  style={styles.statsRow}
                >
                  {stats.series > 0 ? (
                    <View style={styles.statItem}>
                      <View
                        style={[
                          styles.statIconContainer,
                          {
                            backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                          },
                        ]}
                      >
                        <Icon
                          name="layers"
                          size={16}
                          color={theme.colors.accent}
                          strokeWidth={2}
                        />
                      </View>
                      <VStack style={styles.statTextContainer}>
                        <Text
                          weight="bold"
                          style={[
                            styles.statNumber,
                            {
                              color: theme.colors.text,
                              fontSize: 16,
                            },
                          ]}
                        >
                          {stats.series}
                        </Text>
                        <Text
                          style={[
                            styles.statLabel,
                            {
                              color: theme.colors.textMuted,
                              fontSize: 11,
                            },
                          ]}
                        >
                          {stats.series === 1 ? "Series" : "Series"}
                        </Text>
                      </VStack>
                    </View>
                  ) : null}

                  {stats.exercises > 0 ? (
                    <View style={styles.statItem}>
                      <View
                        style={[
                          styles.statIconContainer,
                          {
                            backgroundColor: hexToRgba(theme.colors.accent2, 0.15),
                          },
                        ]}
                      >
                        <Icon
                          name="fitness"
                          size={16}
                          color={theme.colors.accent2}
                          strokeWidth={2}
                        />
                      </View>
                      <VStack style={styles.statTextContainer}>
                        <Text
                          weight="bold"
                          style={[
                            styles.statNumber,
                            {
                              color: theme.colors.text,
                              fontSize: 16,
                            },
                          ]}
                        >
                          {stats.exercises}
                        </Text>
                        <Text
                          style={[
                            styles.statLabel,
                            {
                              color: theme.colors.textMuted,
                              fontSize: 11,
                            },
                          ]}
                        >
                          {stats.exercises === 1 ? "Exercise" : "Exercises"}
                        </Text>
                      </VStack>
                    </View>
                  ) : null}

                  {stats.sets > 0 ? (
                    <View style={styles.statItem}>
                      <View
                        style={[
                          styles.statIconContainer,
                          {
                            backgroundColor: hexToRgba(theme.colors.textMuted, 0.15),
                          },
                        ]}
                      >
                        <Icon
                          name="fitness"
                          size={16}
                          color={theme.colors.textMuted}
                          strokeWidth={2}
                        />
                      </View>
                      <VStack style={styles.statTextContainer}>
                        <Text
                          weight="bold"
                          style={[
                            styles.statNumber,
                            {
                              color: theme.colors.text,
                              fontSize: 16,
                            },
                          ]}
                        >
                          {stats.sets}
                        </Text>
                        <Text
                          style={[
                            styles.statLabel,
                            {
                              color: theme.colors.textMuted,
                              fontSize: 11,
                            },
                          ]}
                        >
                          {stats.sets === 1 ? "Set" : "Sets"}
                        </Text>
                      </VStack>
                    </View>
                  ) : null}
                </HStack>
              </View>
            ) : null}
          </VStack>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 2,
  },
  card: {
    overflow: "hidden",
    borderWidth: 0,
  },
  content: {
    gap: 16,
    position: "relative",
  },
  header: {
    gap: 12,
  },
  title: {
    fontWeight: "700",
  },
  dateText: {
    marginTop: 2,
  },
  statsContainer: {
    paddingTop: 4,
  },
  statsRow: {
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statTextContainer: {
    gap: 2,
  },
  statNumber: {
    fontWeight: "700",
    lineHeight: 20,
  },
  statLabel: {
    lineHeight: 14,
  },
  assignBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
