import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

import type { ClientWorkoutAssignment, WorkoutTemplate } from "../types";

export function AssignedWorkoutCard(props: {
  assignment: ClientWorkoutAssignment;
  template: WorkoutTemplate | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const title = props.template?.title ?? t("client.workouts.workout", "Workout");
  const scheduled = useMemo(
    () => formatShortDate(props.assignment.scheduledFor),
    [props.assignment.scheduledFor]
  );

  const durationMin = useMemo(() => {
    try {
      const series = props.template?.state?.series ?? [];
      const total = series.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);
      return total > 0 ? total : null;
    } catch {
      return null;
    }
  }, [props.template?.state]);

  const status = props.assignment.status ?? "assigned";
  const statusLabel =
    status === "completed"
      ? t("client.workouts.done", "Done")
      : t("client.workouts.upcoming", "Upcoming");

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        { transform: [{ scale: pressed ? 0.985 : 1 }], opacity: pressed ? 0.95 : 1 },
      ]}
    >
      <Card
        padded
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: hexToRgba(theme.colors.accent, 0.12),
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        <HStack align="flex-start" justify="space-between" gap={12}>
          <VStack style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }} numberOfLines={2}>
              {title}
            </Text>

            <HStack align="center" gap={10} style={{ flexWrap: "wrap" }}>
              <HStack align="center" gap={6}>
                <Icon name="calendar-03" size={14} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" }}>
                  {scheduled}
                </Text>
              </HStack>

              {durationMin != null ? (
                <HStack align="center" gap={6}>
                  <Icon name="timer-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" }}>
                    {t("client.workouts.durationMin", "{{n}} min", { n: durationMin })}
                  </Text>
                </HStack>
              ) : null}
            </HStack>
          </VStack>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  status === "completed"
                    ? hexToRgba(theme.colors.accent, 0.18)
                    : hexToRgba(theme.colors.textMuted, 0.14),
              },
            ]}
          >
            <Text
              style={{
                color: status === "completed" ? theme.colors.accent : theme.colors.textMuted,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 0.2,
              }}
            >
              {statusLabel}
            </Text>
          </View>
        </HStack>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
  },
});

