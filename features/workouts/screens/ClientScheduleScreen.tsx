import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  getScreenHorizontalPadding,
  Text,
  TimelineBoard,
  useTheme,
  VStack,
} from "@/shared/ui";

import { updateClientWorkoutAssignmentSchedule } from "../api/clientWorkouts.api";
import { useClientWorkoutSchedule } from "../hooks/useClientWorkoutSchedule";
import { useClientProgramAssignments } from "../hooks/useClientProgramAssignments";
import { useProgramTemplatesPublicMap } from "../hooks/useProgramTemplatesPublicMap";
import { useWorkoutTemplatesMap } from "../hooks/useWorkoutTemplatesMap";

function ScheduleSkeleton() {
  const theme = useTheme();
  return (
    <VStack style={{ gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 84,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surface2,
            opacity: 0.6,
          }}
        />
      ))}
    </VStack>
  );
}

export function ClientScheduleScreen(props: { clientId: string }) {
  const theme = useTheme();
  const screenPadding = getScreenHorizontalPadding(theme);
  const { t } = useAppTranslation();

  const schedule = useClientWorkoutSchedule({ clientId: props.clientId });
  const { error, showErrorToast } = schedule;
  const [timeOverrides, setTimeOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    showErrorToast();
  }, [error, showErrorToast]);

  const templateIds = useMemo(() => schedule.groups.flatMap((g) => g.assignments.map((a) => a.workoutTemplateId)), [schedule.groups]);
  const { templatesById } = useWorkoutTemplatesMap(templateIds);
  const programAssignments = useClientProgramAssignments({ clientId: props.clientId });
  const programTemplateIds = useMemo(
    () => programAssignments.items.map((x) => x.programTemplateId),
    [programAssignments.items]
  );
  const { templatesById: programTemplatesById } = useProgramTemplatesPublicMap(programTemplateIds);
  const programTitleByAssignmentId = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of programAssignments.items) {
      const title =
        programTemplatesById[row.programTemplateId]?.title ??
        t("clients.program", "Program");
      map.set(row.id, title);
    }
    return map;
  }, [programAssignments.items, programTemplatesById, t]);

  const days = useMemo(() => {
    return schedule.groups.map((group, idx) => {
      const d = new Date(`${group.dateKey}T00:00:00`);
      return {
        dateKey: group.dateKey,
        dayLabel: d.toLocaleDateString(undefined, { weekday: "short" }),
        dayNumber: String(d.getDate()),
        isToday: group.dateKey === schedule.todayKey,
        isActive: idx === schedule.selectedDayIndex,
        hasWorkouts: group.assignments.length > 0,
      };
    });
  }, [schedule.groups, schedule.selectedDayIndex, schedule.todayKey]);

  const assignmentById = useMemo(() => {
    const map = new Map<string, { id: string; scheduledFor: string }>();
    for (const group of schedule.groups) {
      for (const row of group.assignments) {
        map.set(row.id, { id: row.id, scheduledFor: row.scheduledFor });
      }
    }
    return map;
  }, [schedule.groups]);

  const timelineItems = useMemo(
    () =>
      (schedule.selectedGroup ? [schedule.selectedGroup] : []).flatMap((group) =>
        group.assignments.map((a) => {
          const isProgram = a.source === "program" || a.programAssignmentId != null;
          const programTitle = a.programAssignmentId
            ? (programTitleByAssignmentId.get(a.programAssignmentId) ?? null)
            : null;
          const statusLabel =
            String(a.status ?? "") === "completed"
              ? t("common.completed", "Completed")
              : t("client.workouts.pending", "Pending");
          return {
            id: a.id,
            dateKey: group.dateKey,
            scheduledTime: timeOverrides[a.id] ?? a.scheduledTime,
            title:
              templatesById[a.workoutTemplateId]?.title ??
              t("client.program.plannedWorkout", "Planned workout"),
            subtitle: isProgram
              ? programTitle ?? t("clients.program", "Program")
              : t("clients.manual", "Single"),
            sourceColor: isProgram ? theme.colors.accent2 : theme.colors.accent,
            statusLabel,
            statusColor:
              String(a.status ?? "") === "completed"
                ? theme.colors.accent
                : theme.colors.textMuted,
          };
        })
      ),
    [schedule.selectedGroup, programTitleByAssignmentId, templatesById, t, theme.colors, timeOverrides]
  );

  return (
    <View style={[styles.root, { paddingHorizontal: screenPadding, paddingTop: theme.spacing.xs, paddingBottom: theme.spacing.sm }]}>
        {schedule.isLoading ? (
          <ScheduleSkeleton />
        ) : (
          <VStack style={{ gap: 6, flex: 1 }}>
            <TimelineBoard
              title={t("client.workouts.schedule", "Schedule")}
              monthLabel={schedule.monthLabel}
              monthIndex={schedule.monthIndex}
              year={schedule.year}
              days={days}
              items={timelineItems}
              canDrag
              onPrevMonth={() => schedule.goPrevMonth()}
              onNextMonth={() => schedule.goNextMonth()}
              onChangeMonthYear={schedule.setMonthYear}
              onSelectDay={(dateKey) => {
                schedule.setSelectedDateKey(dateKey);
              }}
              onPressItem={(id) => router.push(`/(client)/workouts/assigned/${id}` as any)}
              onDropTime={async (id, newTime) => {
                const assignment = assignmentById.get(id);
                if (!assignment) return;
                const prev = timeOverrides[id];
                setTimeOverrides((state) => ({ ...state, [id]: newTime }));
                try {
                  await updateClientWorkoutAssignmentSchedule({
                    assignmentId: id,
                    scheduledFor: assignment.scheduledFor,
                    scheduledTime: newTime,
                  });
                  void schedule.onRefresh();
                } catch (e: unknown) {
                  setTimeOverrides((state) => {
                    const next = { ...state };
                    if (prev == null) delete next[id];
                    else next[id] = prev;
                    return next;
                  });
                  appToast.error(e instanceof Error ? e.message : "Failed to update schedule");
                }
              }}
            />
            <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: "auto" }}>
              {t(
                "client.workouts.dragHint",
                "Drag workouts on the timeline to set their time. If no time is assigned, they default to 8:00 AM."
              )}
            </Text>
          </VStack>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 10 },
});

