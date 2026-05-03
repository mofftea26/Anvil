import { useCallback, useEffect, useMemo, useState } from "react";

import { appToast } from "@/shared/ui";

import { listClientWorkoutAssignments } from "../api/clientWorkouts.api";
import type { ClientWorkoutAssignment } from "../types";
import {
  addDays,
  groupKeyForDateIso,
  toYmd,
} from "../utils/dateUtils";
import { scheduleTimeToMinutes } from "../utils/scheduleTime";

export type ScheduleDayGroup = {
  dateKey: string; // YYYY-MM-DD
  label: string;
  assignments: ClientWorkoutAssignment[];
};

export function useClientWorkoutSchedule(params: { clientId: string }) {
  const todayKey = useMemo(() => toYmd(new Date()), []);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [rows, setRows] = useState<ClientWorkoutAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthRange = useMemo(() => {
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

  const fetchRange = useCallback(async () => {
    setError(null);
    try {
      const data = await listClientWorkoutAssignments({
        clientId: params.clientId,
        startYmd: monthRange.startYmd,
        endYmd: monthRange.endYmd,
      });
      setRows(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load schedule";
      setError(msg);
    }
  }, [params.clientId, monthRange.endYmd, monthRange.startYmd]);

  useEffect(() => {
    setIsLoading(true);
    fetchRange().finally(() => setIsLoading(false));
  }, [fetchRange]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRange();
    setRefreshing(false);
  }, [fetchRange]);

  const groups: ScheduleDayGroup[] = useMemo(() => {
    const map = new Map<string, ClientWorkoutAssignment[]>();
    for (const a of rows) {
      const key = groupKeyForDateIso(a.scheduledFor);
      const arr = map.get(key);
      if (arr) arr.push(a);
      else map.set(key, [a]);
    }

    const days: ScheduleDayGroup[] = [];
    const totalDays = monthRange.end.getDate();
    for (let i = 0; i < totalDays; i++) {
      const day = addDays(monthRange.start, i);
      const key = groupKeyForDateIso(day.toISOString());
      const assignments = (map.get(key) ?? []).slice().sort((a, b) => {
        const tDiff = scheduleTimeToMinutes(a.scheduledTime) - scheduleTimeToMinutes(b.scheduledTime);
        if (tDiff !== 0) return tDiff;
        return String(a.id).localeCompare(String(b.id));
      });
      const label = day.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      days.push({ dateKey: key, label, assignments });
    }
    return days;
  }, [monthRange.end, monthRange.start, rows]);

  const showErrorToast = useCallback(() => {
    if (error) appToast.error(error);
  }, [error]);

  const selectedDayIndex = useMemo(
    () => Math.max(0, groups.findIndex((g) => g.dateKey === selectedDateKey)),
    [groups, selectedDateKey]
  );

  const selectedGroup = useMemo(
    () => groups[selectedDayIndex] ?? null,
    [groups, selectedDayIndex]
  );

  const goPrevMonth = useCallback(() => {
    const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1);
    setMonthCursor(next);
    setSelectedDateKey((prev) => {
      const current = new Date(`${prev}T00:00:00`);
      const day = Math.min(current.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate());
      return toYmd(new Date(next.getFullYear(), next.getMonth(), day));
    });
  }, [monthCursor]);
  const goNextMonth = useCallback(() => {
    const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
    setMonthCursor(next);
    setSelectedDateKey((prev) => {
      const current = new Date(`${prev}T00:00:00`);
      const day = Math.min(current.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate());
      return toYmd(new Date(next.getFullYear(), next.getMonth(), day));
    });
  }, [monthCursor]);
  const setMonthYear = useCallback((monthIndex: number, year: number) => {
    const safeMonth = Math.max(0, Math.min(11, monthIndex));
    const safeYear = Math.max(1970, Math.min(2100, year));
    setMonthCursor(new Date(safeYear, safeMonth, 1));
    setSelectedDateKey((prev) => {
      const current = new Date(`${prev}T00:00:00`);
      const day = Math.min(current.getDate(), new Date(safeYear, safeMonth + 1, 0).getDate());
      return toYmd(new Date(safeYear, safeMonth, day));
    });
  }, []);

  return {
    selectedDateKey,
    setSelectedDateKey,
    selectedDayIndex,
    selectedGroup,
    groups,
    isLoading,
    refreshing,
    error,
    showErrorToast,
    onRefresh,
    monthLabel: monthRange.monthLabel,
    monthIndex: monthRange.monthIndex,
    year: monthRange.year,
    goPrevMonth,
    goNextMonth,
    setMonthYear,
    todayKey,
  };
}

