import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { formatShortDate } from "@/features/library/utils/formatShortDate";
import React, { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

type WorkoutCardProps = {
  workout: WorkoutRow;
  updatedAtLabel: string;
  defaultTitle: string;
  onPress: () => void;
};

export function WorkoutCard({
  workout,
  updatedAtLabel,
  defaultTitle,
  onPress,
}: WorkoutCardProps) {
  const theme = useTheme();
  const title = workout.title || defaultTitle;
  const updatedDate = formatShortDate(workout.updatedAt);

  // Extract workout stats from state
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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <Card padded={false} style={{ overflow: "hidden" }}>
        <View style={{ position: "relative" }}>
          <LinearGradient
            colors={[
              hexToRgba(theme.colors.accent, 0.12),
              hexToRgba(theme.colors.accent2, 0.06),
              "rgba(255,255,255,0.00)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <VStack
            style={{
              padding: theme.spacing.md,
              gap: theme.spacing.sm,
            }}
          >
            {/* Header */}
            <HStack align="center" justify="space-between">
              <HStack align="center" gap={10} style={{ flex: 1 }}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                      borderColor: hexToRgba(theme.colors.accent, 0.25),
                    },
                  ]}
                >
                  <Icon
                    name="fitness"
                    size={20}
                    color={theme.colors.accent}
                    strokeWidth={2}
                  />
                </View>
                <VStack style={{ flex: 1, gap: 2 }}>
                  <Text weight="bold" style={{ fontSize: 16 }} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text muted style={{ fontSize: 12 }}>
                    {updatedAtLabel} {updatedDate}
                  </Text>
                </VStack>
              </HStack>
              <Icon
                name="chevron-forward"
                size={18}
                color={theme.colors.textMuted}
                strokeWidth={1.5}
              />
            </HStack>

            {/* Stats */}
            {stats && (stats.series > 0 || stats.exercises > 0 || stats.sets > 0) ? (
              <View
                style={{
                  paddingTop: theme.spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: hexToRgba(theme.colors.border, 0.5),
                }}
              >
                <HStack
                  align="center"
                  gap={theme.spacing.md}
                  style={{ flexWrap: "wrap" }}
                >
                  {stats.series > 0 ? (
                    <View
                      style={[
                        styles.statBadge,
                        {
                          backgroundColor: hexToRgba(theme.colors.accent, 0.1),
                          borderColor: hexToRgba(theme.colors.accent, 0.2),
                        },
                      ]}
                    >
                      <Icon
                        name="layers"
                        size={12}
                        color={theme.colors.accent}
                        strokeWidth={2}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: theme.colors.accent,
                        }}
                      >
                        {stats.series} {stats.series === 1 ? "Series" : "Series"}
                      </Text>
                    </View>
                  ) : null}
                  {stats.exercises > 0 ? (
                    <View
                      style={[
                        styles.statBadge,
                        {
                          backgroundColor: hexToRgba(theme.colors.accent2, 0.1),
                          borderColor: hexToRgba(theme.colors.accent2, 0.2),
                        },
                      ]}
                    >
                      <Icon
                        name="fitness"
                        size={12}
                        color={theme.colors.accent2}
                        strokeWidth={2}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: theme.colors.accent2,
                        }}
                      >
                        {stats.exercises} {stats.exercises === 1 ? "Exercise" : "Exercises"}
                      </Text>
                    </View>
                  ) : null}
                  {stats.sets > 0 ? (
                    <View
                      style={[
                        styles.statBadge,
                        {
                          backgroundColor: hexToRgba(theme.colors.textMuted, 0.1),
                          borderColor: hexToRgba(theme.colors.textMuted, 0.2),
                        },
                      ]}
                    >
                      <Icon
                        name="fitness"
                        size={12}
                        color={theme.colors.textMuted}
                        strokeWidth={2}
                      />
                      <Text
                        muted
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {stats.sets} {stats.sets === 1 ? "Set" : "Sets"}
                      </Text>
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
