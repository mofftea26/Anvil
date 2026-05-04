import React, { memo, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { hexToRgba } from "@/features/linking/utils/coachFormatting";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

import type { ProgramProgressDay, ProgramProgressDayStatus } from "../../types";

type WeekRow = {
  weekIndex: number;
  days: ProgramProgressDay[];
};

export type ProgramCalendarGridProps = {
  days: ProgramProgressDay[];
  onPressDay: (day: ProgramProgressDay) => void;
  /** Override the default "Week N" label. Receives a 1-indexed week number. */
  weekLabel?: (weekNumber: number) => string;
  /** Highlight the cell matching this `dayKey` (e.g. "today"). */
  highlightDayKey?: string | null;
};

function statusVisuals(
  status: ProgramProgressDayStatus,
  theme: ReturnType<typeof useTheme>
): { bg: string; border: string; iconColor: string; numberColor: string } {
  switch (status) {
    case "completed":
      return {
        bg: hexToRgba(theme.colors.accent, 0.18),
        border: hexToRgba(theme.colors.accent, 0.45),
        iconColor: theme.colors.accent,
        numberColor: theme.colors.text,
      };
    case "missed":
      return {
        bg: hexToRgba(theme.colors.danger, 0.12),
        border: hexToRgba(theme.colors.danger, 0.35),
        iconColor: theme.colors.danger,
        numberColor: theme.colors.text,
      };
    case "rest":
      return {
        bg: theme.colors.surface2,
        border: theme.colors.border,
        iconColor: theme.colors.textMuted,
        numberColor: theme.colors.textMuted,
      };
    case "pending":
    default:
      return {
        bg: theme.colors.surface,
        border: theme.colors.border,
        iconColor: theme.colors.text,
        numberColor: theme.colors.text,
      };
  }
}

const DayCell = memo(function DayCell(props: {
  day: ProgramProgressDay;
  isHighlighted: boolean;
  onPress: (day: ProgramProgressDay) => void;
}) {
  const theme = useTheme();
  const { day, isHighlighted, onPress } = props;
  const visuals = statusVisuals(day.status, theme);
  const iconName = day.isRest ? "pause-circle" : "dumbbell";

  return (
    <Pressable
      onPress={() => onPress(day)}
      accessibilityRole="button"
      accessibilityLabel={`Week ${day.weekIndex + 1} day ${day.dayIndex + 1}`}
      style={({ pressed }) => [
        styles.cell,
        {
          backgroundColor: visuals.bg,
          borderColor: isHighlighted ? theme.colors.accent : visuals.border,
          borderWidth: isHighlighted ? 1.5 : 1,
          opacity: pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Text
        weight="bold"
        style={{
          fontSize: 13,
          color: visuals.numberColor,
        }}
      >
        {day.dayIndex + 1}
      </Text>
      <Icon
        name={iconName}
        size={14}
        color={visuals.iconColor}
        strokeWidth={1.8}
      />
    </Pressable>
  );
});

const WeekRowView = memo(function WeekRowView(props: {
  row: WeekRow;
  weekLabel: string;
  highlightDayKey: string | null | undefined;
  onPressDay: (day: ProgramProgressDay) => void;
}) {
  const theme = useTheme();
  const { row, weekLabel, highlightDayKey, onPressDay } = props;

  return (
    <VStack style={{ gap: 6 }}>
      <Text
        variant="caption"
        muted
        weight="semibold"
        style={{
          fontSize: 11,
          letterSpacing: 0.4,
          color: theme.colors.textMuted,
        }}
      >
        {weekLabel.toUpperCase()}
      </Text>
      <HStack gap={6}>
        {row.days.map((day) => (
          <DayCell
            key={day.dayKey}
            day={day}
            isHighlighted={Boolean(highlightDayKey) && highlightDayKey === day.dayKey}
            onPress={onPressDay}
          />
        ))}
      </HStack>
    </VStack>
  );
});

export function ProgramCalendarGrid(props: ProgramCalendarGridProps) {
  const { t } = useAppTranslation();
  const { days, onPressDay, weekLabel, highlightDayKey } = props;

  const rows = useMemo<WeekRow[]>(() => {
    const map = new Map<number, ProgramProgressDay[]>();
    for (const day of days) {
      const arr = map.get(day.weekIndex);
      if (arr) arr.push(day);
      else map.set(day.weekIndex, [day]);
    }
    for (const [, value] of map) {
      value.sort((a, b) => a.dayIndex - b.dayIndex);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([weekIndex, dayList]) => ({ weekIndex, days: dayList }));
  }, [days]);

  const fallbackWeekLabel = (n: number) =>
    t("client.programProgress.weekLabel", "Week {{n}}", { n: String(n) });
  const labelFn = weekLabel ?? fallbackWeekLabel;

  return (
    <VStack style={{ gap: 12 }}>
      {rows.map((row) => (
        <WeekRowView
          key={row.weekIndex}
          row={row}
          weekLabel={labelFn(row.weekIndex + 1)}
          highlightDayKey={highlightDayKey}
          onPressDay={onPressDay}
        />
      ))}
    </VStack>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
