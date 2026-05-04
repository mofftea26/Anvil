import React, { useMemo } from "react";
import { View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, HStack, Text, useTheme, VStack } from "@/shared/ui";

import type { ActiveProgramDetail } from "../../types";

export type ProgramInfoSectionProps = {
  detail: ActiveProgramDetail | null;
  loading: boolean;
};

function StatCell(props: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "30%",
        minWidth: "28%",
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Text weight="bold" style={{ fontSize: 16 }} numberOfLines={1}>
        {props.value}
      </Text>
      <Text variant="caption" muted numberOfLines={2} style={{ marginTop: 2, fontSize: 10 }}>
        {props.label}
      </Text>
    </View>
  );
}

export function ProgramInfoSection(props: ProgramInfoSectionProps) {
  const { t } = useAppTranslation();
  const { detail, loading } = props;

  const difficultyLabel = useMemo(() => {
    const raw = detail?.difficulty;
    if (!raw) return "—";
    const d = raw.toLowerCase();
    if (d === "beginner") return t("library.programsScreen.difficultyBeginner", "Beginner");
    if (d === "intermediate") return t("library.programsScreen.difficultyIntermediate", "Intermediate");
    if (d === "advanced") return t("library.programsScreen.difficultyAdvanced", "Advanced");
    return raw;
  }, [detail?.difficulty, t]);

  const startLabel = useMemo(() => {
    if (!detail?.startDate) return "—";
    const dt = new Date(`${detail.startDate}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return detail.startDate;
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }, [detail?.startDate]);

  const endLabel = useMemo(() => {
    if (!detail?.expectedEndDate) return "—";
    const dt = new Date(`${detail.expectedEndDate}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return detail.expectedEndDate;
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }, [detail?.expectedEndDate]);

  const weeksLabel =
    detail?.durationWeeks && detail.durationWeeks > 0
      ? t("client.program.weeks", "{{n}} weeks", { n: String(detail.durationWeeks) })
      : "—";

  if (loading && !detail) {
    return (
      <Card bordered background="surface2" style={{ padding: 14, gap: 8 }}>
        <Text muted>{t("common.loading", "Loading…")}</Text>
      </Card>
    );
  }

  if (!detail) return null;

  return (
    <Card bordered background="surface2" style={{ padding: 14, gap: 12 }}>
      <VStack style={{ gap: 4 }}>
        <Text weight="bold" style={{ fontSize: 20, lineHeight: 24 }} numberOfLines={2}>
          {detail.title}
        </Text>
        {detail.description ? (
          <Text variant="caption" muted style={{ lineHeight: 18 }}>
            {detail.description}
          </Text>
        ) : null}
      </VStack>

      <HStack gap={8} style={{ flexWrap: "wrap" }}>
        <StatCell
          label={t("client.programProgress.info.startDate", "Start date")}
          value={startLabel}
        />
        <StatCell
          label={t("client.programProgress.info.expectedEnd", "Expected end")}
          value={endLabel}
        />
        <StatCell
          label={t("client.programProgress.info.duration", "Duration")}
          value={weeksLabel}
        />
        <StatCell
          label={t("client.programProgress.info.difficulty", "Difficulty")}
          value={difficultyLabel}
        />
      </HStack>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <StatCell label={t("client.program.totalDays", "Total days")} value={String(detail.totalDays)} />
        <StatCell
          label={t("client.program.workoutDays", "Workout days")}
          value={String(detail.workoutDays)}
        />
        <StatCell
          label={t("client.programProgress.info.restDays", "Rest days")}
          value={String(detail.restDays)}
        />
        <StatCell
          label={t("client.program.completed", "Completed")}
          value={String(detail.completedDays)}
        />
        <StatCell
          label={t("client.programProgress.info.pendingDays", "Pending")}
          value={String(detail.pendingDays)}
        />
        <StatCell
          label={t("client.programProgress.info.missedDays", "Missed")}
          value={String(detail.missedDays)}
        />
      </View>
    </Card>
  );
}
