import { useCallback, useEffect, useMemo, useState } from "react";

import { appToast } from "@/shared/ui";

import { listClientWorkoutAssignments } from "../api/clientWorkouts.api";
import type { ClientWorkoutAssignment } from "../types";
import {
  addDays,
  formatWeekRangeLabel,
  groupKeyForDateIso,
  startOfWeekMonday,
  toYmd,
} from "../utils/dateUtils";

export type ScheduleDayGroup = {
  dateKey: string; // YYYY-MM-DD
  label: string;
  assignments: ClientWorkoutAssignment[];
};

export function useClientWorkoutSchedule(params: { clientId: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [rows, setRows] = useState<ClientWorkoutAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekLabel = useMemo(() => formatWeekRangeLabel(weekStart), [weekStart]);

  const range = useMemo(() => {
    const startYmd = toYmd(weekStart);
    const endYmd = toYmd(addDays(weekStart, 6));
    return { startYmd, endYmd };
  }, [weekStart]);

  const fetchWeek = useCallback(async () => {
    setError(null);
    try {
      const data = await listClientWorkoutAssignments({
        clientId: params.clientId,
        startYmd: range.startYmd,
        endYmd: range.endYmd,
      });
      setRows(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load schedule";
      setError(msg);
    }
  }, [params.clientId, range.endYmd, range.startYmd]);

  useEffect(() => {
    setIsLoading(true);
    fetchWeek().finally(() => setIsLoading(false));
  }, [fetchWeek]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWeek();
    setRefreshing(false);
  }, [fetchWeek]);

  const goPrevWeek = useCallback(() => {
    setSelectedDayIndex(null);
    setWeekStart((d) => addDays(d, -7));
  }, []);
  const goNextWeek = useCallback(() => {
    setSelectedDayIndex(null);
    setWeekStart((d) => addDays(d, 7));
  }, []);
  const goToday = useCallback(() => {
    setSelectedDayIndex(null);
    setWeekStart(startOfWeekMonday(new Date()));
  }, []);

  const groups: ScheduleDayGroup[] = useMemo(() => {
    const map = new Map<string, ClientWorkoutAssignment[]>();
    for (const a of rows) {
      const key = groupKeyForDateIso(a.scheduledFor);
      const arr = map.get(key);
      if (arr) arr.push(a);
      else map.set(key, [a]);
    }

    const days: ScheduleDayGroup[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const key = groupKeyForDateIso(day.toISOString());
      const assignments = map.get(key) ?? [];
      const label = day.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      days.push({ dateKey: key, label, assignments });
    }
    return days;
  }, [rows, weekStart]);

  const visibleGroups = useMemo(() => {
    if (selectedDayIndex == null) return groups;
    return groups[selectedDayIndex] ? [groups[selectedDayIndex]] : [];
  }, [groups, selectedDayIndex]);

  const showErrorToast = useCallback(() => {
    if (error) appToast.error(error);
  }, [error]);

  return {
    weekStart,
    weekLabel,
    selectedDayIndex,
    setSelectedDayIndex,
    groups,
    visibleGroups,
    isLoading,
    refreshing,
    error,
    showErrorToast,
    onRefresh,
    goPrevWeek,
    goNextWeek,
    goToday,
  };
}

