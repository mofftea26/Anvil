import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Chip, HStack, Icon, ProgressBar, Text, useTheme, VStack } from "@/shared/ui";

import type { ClientProgramAssignment } from "../types";
import type { PublicProgramTemplate } from "../hooks/useProgramTemplatesPublicMap";
import { computeProgressPercent, normalizeCompletedDayKeys, totalPlannedDayKeys } from "../utils/programProgress";

export function ClientProgramAssignmentCard(props: {
  assignment: ClientProgramAssignment;
  template: PublicProgramTemplate | null;
  onPressSchedule: () => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const status = String(props.assignment.status ?? "");
  const isArchived = status === "archived";

  const plannedKeys = useMemo(() => totalPlannedDayKeys((props.template?.state as any) ?? null), [props.template?.state]);
  const completedKeys = useMemo(() => normalizeCompletedDayKeys(props.assignment.progress), [props.assignment.progress]);

  const percent = useMemo(
    () => computeProgressPercent({ totalPlannedDays: plannedKeys.length, completedDays: completedKeys.length }),
    [completedKeys.length, plannedKeys.length]
  );

  const subtitle = useMemo(() => {
    const difficulty = props.template?.difficulty ? String(props.template.difficulty) : null;
    const weeks = typeof props.template?.durationWeeks === "number" ? props.template!.durationWeeks : null;
    const bits: string[] = [];
    if (difficulty) bits.push(difficulty);
    if (weeks) bits.push(t("client.program.weeks", "{{n}} weeks", { n: String(weeks) }));
    return bits.join(" • ");
  }, [props.template?.difficulty, props.template?.durationWeeks, t]);

  return (
    <Pressable
      onPress={props.onPressSchedule}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <VStack style={{ gap: 10 }}>
        <HStack align="center" justify="space-between">
          <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text weight="bold" numberOfLines={2} style={{ fontSize: 16 }}>
              {props.template?.title ?? t("clients.program", "Program")}
            </Text>
            {subtitle ? (
              <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </VStack>

          <Chip
            label={isArchived ? t("common.archived", "Archived") : t("common.active", "Active")}
            isActive
            activeBackgroundColor={hexToRgba(isArchived ? theme.colors.textMuted : theme.colors.accent, 0.18)}
            activeBorderColor={hexToRgba(isArchived ? theme.colors.textMuted : theme.colors.accent, 0.28)}
            activeLabelColor={isArchived ? theme.colors.textMuted : theme.colors.accent}
          />
        </HStack>

        <VStack style={{ gap: 6 }}>
          <HStack align="center" justify="space-between">
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
              {t("client.program.starts", "Starts {{date}}", { date: props.assignment.startDate })}
            </Text>
            <HStack align="center" gap={6}>
              <Icon name="checkmark-circle-outline" size={16} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                {t("client.program.progressLabel", "{{x}} / {{y}} days", {
                  x: String(completedKeys.length),
                  y: String(plannedKeys.length),
                })}
              </Text>
            </HStack>
          </HStack>

          <ProgressBar progress={plannedKeys.length ? completedKeys.length / plannedKeys.length : 0} />

          <Text style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: "right" }}>
            {t("client.program.percent", "{{p}}%", { p: String(percent) })}
          </Text>
        </VStack>

        <View style={[styles.ctaRow, { borderTopColor: hexToRgba(theme.colors.textMuted, 0.14) }]}>
          <HStack align="center" justify="space-between">
            <Text weight="semibold" style={{ color: theme.colors.accent }}>
              {t("client.program.viewSchedule", "View schedule")}
            </Text>
            <Icon name="chevron-forward" size={18} color={theme.colors.accent} />
          </HStack>
        </View>
      </VStack>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  ctaRow: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
});

