import type { WorkoutState } from "@/features/builder/types/workoutState";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { hexToRgba } from "@/features/linking/utils/coachFormatting";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, Button, Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

import { useAssignedWorkout } from "../../hooks/useAssignedWorkout";
import type { ProgramProgressDay } from "../../types";

function previewLinesFromTemplate(state: WorkoutState | null, max: number): string[] {
  if (!state?.series?.length) return [];
  const lines: string[] = [];
  for (const s of state.series) {
    for (const ex of s.exercises ?? []) {
      const title = ex.title?.trim();
      if (title) lines.push(title);
      if (lines.length >= max) return lines;
    }
  }
  return lines;
}

function Pill(props: { children: React.ReactNode; accent?: boolean }) {
  const theme = useTheme();
  const accent = theme.colors.accent;
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: props.accent ? hexToRgba(accent, 0.2) : theme.colors.surface,
        borderWidth: 1,
        borderColor: props.accent ? hexToRgba(accent, 0.45) : theme.colors.border,
      }}
    >
      <Text variant="caption" weight="semibold" style={{ fontSize: 11 }}>
        {props.children}
      </Text>
    </View>
  );
}

export type WorkoutDayModalProps = {
  visible: boolean;
  onClose: () => void;
  day: ProgramProgressDay | null;
  /** Resolved `clientWorkoutAssignments.id` for this program day, if any. */
  assignmentId: string | null;
  programTitle: string;
};

export function WorkoutDayModal(props: WorkoutDayModalProps) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const insets = useSafeAreaInsets();
  const { visible, onClose, day, assignmentId, programTitle } = props;

  const q = useAssignedWorkout(assignmentId ?? "", {
    enabled: visible && Boolean(assignmentId),
  });

  useEffect(() => {
    q.showErrorToast();
  }, [q.error, q.showErrorToast]);

  const statusLabel = useMemo(() => {
    if (!day) return "";
    const k = day.status;
    return t(`client.programProgress.dayStatus.${k}` as const, k);
  }, [day, t]);

  const dateLabel = useMemo(() => {
    if (!day) return "";
    const dt = new Date(`${day.scheduledFor}T12:00:00`);
    if (Number.isNaN(dt.getTime())) return day.scheduledFor;
    return dt.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, [day]);

  const weekLabel = useMemo(() => {
    if (!day) return "";
    return t("client.programProgress.weekLabel", "Week {{n}}", { n: String(day.weekIndex + 1) });
  }, [day, t]);

  const workoutState = (q.template?.state as WorkoutState | null) ?? null;
  const previewLines = useMemo(
    () => previewLinesFromTemplate(workoutState, 6),
    [workoutState]
  );

  const isPending = Boolean(day && (day.status === "pending" || day.status === "missed"));

  const goWorkout = () => {
    if (!assignmentId) {
      appToast.error(t("client.programProgress.modal.noAssignment", "Workout not scheduled yet."));
      return;
    }
    if (isPending) {
      router.push(`/(client)/workouts/run/${assignmentId}` as Parameters<typeof router.push>[0]);
    } else {
      router.push(`/(client)/workouts/assigned/${assignmentId}` as Parameters<typeof router.push>[0]);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: "86%",
            backgroundColor: theme.colors.surface2,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, theme.spacing.md),
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: theme.spacing.lg,
              gap: theme.spacing.md,
            }}
          >
            <HStack align="center" justify="space-between">
              <Text weight="bold" style={{ fontSize: 18, flex: 1 }} numberOfLines={2}>
                {q.template?.title ?? t("client.programProgress.modal.title", "Workout day")}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t("common.close", "Close")}
              >
                <Icon name="close" size={22} color={theme.colors.textMuted} />
              </Pressable>
            </HStack>

            <HStack gap={8} style={{ flexWrap: "wrap" }}>
              <Pill>{programTitle}</Pill>
              {day ? <Pill accent>{weekLabel}</Pill> : null}
              {day ? <Pill>{statusLabel}</Pill> : null}
            </HStack>

            <Text variant="caption" muted>
              {dateLabel}
            </Text>

            {!assignmentId && day && !day.isRest ? (
              <Card background="surface" bordered style={{ padding: 12 }}>
                <Text style={{ color: theme.colors.textMuted, lineHeight: 20 }}>
                  {t(
                    "client.programProgress.modal.awaitingSchedule",
                    "This day does not have a linked workout assignment yet.",
                  )}
                </Text>
              </Card>
            ) : null}

            {q.isLoading && assignmentId ? (
              <Text muted>{t("common.loading", "Loading…")}</Text>
            ) : previewLines.length > 0 ? (
              <VStack style={{ gap: 6 }}>
                <Text weight="semibold">
                  {t("client.programProgress.modal.preview", "Exercises")}
                </Text>
                {previewLines.map((line) => (
                  <HStack key={line} align="center" gap={8}>
                    <Icon name="checkmark-circle" size={14} color={theme.colors.accent} />
                    <Text style={{ flex: 1 }} numberOfLines={2}>
                      {line}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            ) : assignmentId && q.template ? (
              <Text muted>{t("client.programProgress.modal.noPreview", "No exercise list available.")}</Text>
            ) : null}

            {assignmentId ? (
              <Button onPress={goWorkout}>
                {isPending
                  ? t("client.programProgress.modal.goRun", "Go to workout")
                  : t("client.programProgress.modal.viewAssigned", "View workout")}
              </Button>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
