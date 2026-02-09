import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

import type { WorkoutSession, WorkoutTemplate } from "../types";
import { formatDurationSeconds } from "../utils/workoutMetrics";

export function SessionCard(props: {
  session: WorkoutSession;
  template: WorkoutTemplate | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const title = props.template?.title ?? t("client.workouts.workout", "Workout");
  const started = useMemo(() => formatShortDate(props.session.startedAt), [props.session.startedAt]);
  const duration = formatDurationSeconds(props.session.durationSec ?? 0);
  const done = props.session.status === "completed";

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
            borderColor: hexToRgba(theme.colors.textMuted, 0.14),
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
                  {started}
                </Text>
              </HStack>
              <HStack align="center" gap={6}>
                <Icon name="timer-outline" size={14} color={theme.colors.textMuted} />
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" }}>
                  {duration}
                </Text>
              </HStack>
            </HStack>
          </VStack>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: done
                  ? hexToRgba(theme.colors.accent, 0.18)
                  : hexToRgba(theme.colors.textMuted, 0.14),
              },
            ]}
          >
            <Text
              style={{
                color: done ? theme.colors.accent : theme.colors.textMuted,
                fontSize: 12,
                fontWeight: "800",
              }}
            >
              {done ? t("client.workouts.done", "Done") : t("client.workouts.inProgress", "In progress")}
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

