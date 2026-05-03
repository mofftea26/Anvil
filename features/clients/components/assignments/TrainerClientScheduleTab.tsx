import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ScheduleTimelineBoard } from "@/features/workouts/components/ScheduleTimelineBoard";
import { useProgramTemplatesPublicMap } from "@/features/workouts/hooks/useProgramTemplatesPublicMap";
import { useWorkoutTemplatesMap } from "@/features/workouts/hooks/useWorkoutTemplatesMap";
import { addDays, toYmd } from "@/features/workouts/utils/dateUtils";
import {
  listClientProgramAssignmentsForTrainer,
  listClientWorkoutAssignmentsForTrainer,
  updateClientWorkoutAssignmentSchedule,
} from "@/features/clients/api/assignments.api";
import { appToast, Text, useTheme, VStack } from "@/shared/ui";

export function TrainerClientScheduleTab(props: { trainerId: string; clientId: string }) {
  const theme = useTheme();
  const todayKey = useMemo(() => toYmd(new Date()), []);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [programAssignments, setProgramAssignments] = useState<any[]>([]);
  const [timeOverrides, setTimeOverrides] = useState<Record<string, string>>({});

  const range = useMemo(() => {
    const start = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const end = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    return {
      start,
      end,
      startYmd: toYmd(start),
      endYmd: toYmd(end),
      monthLabel: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      monthIndex: start.getMonth(),
      year: start.getFullYear(),
    };
  }, [monthCursor]);

  const load = useCallback(async () => {
    if (!props.trainerId || !props.clientId) return;
    const [assignmentRowsRes, programRowsRes] = await Promise.allSettled([
      listClientWorkoutAssignmentsForTrainer({
        trainerId: props.trainerId,
        clientId: props.clientId,
        startYmd: range.startYmd,
        endYmd: range.endYmd,
      }),
      listClientProgramAssignmentsForTrainer({
        trainerId: props.trainerId,
        clientId: props.clientId,
      }),
    ]);
    const assignmentRows = assignmentRowsRes.status === "fulfilled" ? assignmentRowsRes.value : [];
    const programRows = programRowsRes.status === "fulfilled" ? programRowsRes.value : [];
    if (assignmentRowsRes.status === "rejected" && programRowsRes.status === "rejected") {
      throw new Error("Failed to load schedule");
    }
    setRows(assignmentRows);
    setProgramAssignments(programRows);
  }, [props.clientId, props.trainerId, range.endYmd, range.startYmd]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: unknown) => {
        appToast.error(e instanceof Error ? e.message : "Failed to load schedule");
      })
      .finally(() => setLoading(false));
  }, [load]);

  const workoutTemplateIds = useMemo(
    () => rows.map((x) => x.workoutTemplateId).filter(Boolean),
    [rows]
  );
  const { templatesById } = useWorkoutTemplatesMap(workoutTemplateIds);
  const programTemplateIds = useMemo(
    () => Array.from(new Set(programAssignments.map((x) => x.programtemplateid).filter(Boolean))),
    [programAssignments]
  );
  const { templatesById: programTemplatesById } = useProgramTemplatesPublicMap(programTemplateIds);
  const programTitleByAssignmentId = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of programAssignments) {
      map.set(
        row.id,
        programTemplatesById[row.programtemplateid]?.title ?? "Program"
      );
    }
    return map;
  }, [programAssignments, programTemplatesById]);

  const days = useMemo(() => {
    const total = range.end.getDate();
    return Array.from({ length: total }, (_, idx) => {
      const d = addDays(range.start, idx);
      const dateKey = toYmd(d);
      return {
        dateKey,
        dayLabel: d.toLocaleDateString(undefined, { weekday: "short" }),
        dayNumber: String(d.getDate()),
        isToday: dateKey === todayKey,
        isActive: dateKey === selectedDateKey,
        hasWorkouts: rows.some((x) => x.scheduledFor === dateKey),
      };
    });
  }, [range.end, range.start, rows, selectedDateKey, todayKey]);

  const timelineItems = useMemo(
    () =>
      rows
        .filter((row) => row.scheduledFor === selectedDateKey)
        .map((row) => {
        const isProgram = row.source === "program" || row.programAssignmentId != null;
        const programTitle = row.programAssignmentId
          ? (programTitleByAssignmentId.get(row.programAssignmentId) ?? null)
          : null;
        return {
          id: row.id,
          dateKey: row.scheduledFor,
          scheduledTime: timeOverrides[row.id] ?? row.scheduledTime,
          title: templatesById[row.workoutTemplateId]?.title ?? "Workout",
          subtitle: isProgram ? programTitle ?? "Program" : "Single",
          sourceColor: isProgram ? theme.colors.accent2 : theme.colors.accent,
          statusLabel: String(row.status ?? "") === "completed" ? "Completed" : "Pending",
          statusColor:
            String(row.status ?? "") === "completed"
              ? theme.colors.accent
              : theme.colors.textMuted,
        };
      }),
    [programTitleByAssignmentId, rows, templatesById, theme.colors, timeOverrides, selectedDateKey]
  );

  const rowById = useMemo(() => new Map(rows.map((x) => [x.id, x])), [rows]);

  return (
    <View style={styles.content}>
      {loading ? (
        <View style={[styles.loading, { backgroundColor: theme.colors.surface2 }]} />
      ) : (
        <VStack style={{ gap: 12, flex: 1 }}>
          <ScheduleTimelineBoard
            title="Client schedule"
            monthLabel={range.monthLabel}
            monthIndex={range.monthIndex}
            year={range.year}
            days={days}
            items={timelineItems}
            canDrag
            onPrevMonth={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            onNextMonth={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            onChangeMonthYear={(monthIndex, year) => {
              setMonthCursor(new Date(year, monthIndex, 1));
            }}
            onSelectDay={(dateKey) => setSelectedDateKey(dateKey)}
            onDropTime={async (id, newTime) => {
              const row = rowById.get(id);
              if (!row) return;
              const prev = timeOverrides[id];
              setTimeOverrides((state) => ({ ...state, [id]: newTime }));
              try {
                await updateClientWorkoutAssignmentSchedule({
                  assignmentId: id,
                  scheduledFor: row.scheduledFor,
                  scheduledTime: newTime,
                });
                void load();
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
            Drag workouts to assign client schedule times. Program and single workouts can both be moved.
          </Text>
        </VStack>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 12,
  },
  loading: {
    height: 240,
    borderRadius: 18,
    opacity: 0.55,
  },
});

