import { useCallback, useEffect, useMemo, useState } from "react";

import { addDays, toYmd } from "@/features/workouts/utils/dateUtils";
import {
  DEFAULT_SCHEDULE_TIME,
  normalizeScheduleTime,
  scheduleTimeToMinutes,
} from "@/shared/utils/scheduleTime";

import {
  deleteClientCheckin,
  fetchTrainerCheckInDateKeysInRange,
  fetchTrainerCheckinsByDate,
  reorderClientCheckin,
  upsertClientCheckin,
} from "../api/checkins.api";
import type { CheckInStatus, TrainerCheckIn } from "../types";

function sortDayRows(list: TrainerCheckIn[]): TrainerCheckIn[] {
  return list.slice().sort((a, b) => {
    const tDiff =
      scheduleTimeToMinutes(a.scheduledTime ?? DEFAULT_SCHEDULE_TIME) -
      scheduleTimeToMinutes(b.scheduledTime ?? DEFAULT_SCHEDULE_TIME);
    if (tDiff !== 0) return tDiff;
    return a.id.localeCompare(b.id);
  });
}

export function useTrainerCheckIns() {
  const todayKey = useMemo(() => toYmd(new Date()), []);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [dateKeysWithCheckIns, setDateKeysWithCheckIns] = useState<Set<string>>(
    () => new Set()
  );
  const [rows, setRows] = useState<TrainerCheckIn[]>([]);
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

  const loadMonthDots = useCallback(async () => {
    setError(null);
    try {
      const set = await fetchTrainerCheckInDateKeysInRange({
        startYmd: monthRange.startYmd,
        endYmd: monthRange.endYmd,
      });
      setDateKeysWithCheckIns(set);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load check-in calendar";
      setError(msg);
    }
  }, [monthRange.endYmd, monthRange.startYmd]);

  const loadSelectedDay = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchTrainerCheckinsByDate(selectedDateKey);
      setRows(sortDayRows(list));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load check-ins";
      setError(msg);
    }
  }, [selectedDateKey]);

  useEffect(() => {
    void loadMonthDots().catch(() => {});
  }, [loadMonthDots]);

  useEffect(() => {
    setIsLoading(true);
    void loadSelectedDay().finally(() => setIsLoading(false));
  }, [loadSelectedDay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadMonthDots(), loadSelectedDay()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadMonthDots, loadSelectedDay]);

  const days = useMemo(() => {
    const totalDays = monthRange.end.getDate();
    const out: Array<{
      dateKey: string;
      dayLabel: string;
      dayNumber: string;
      isToday: boolean;
      isActive: boolean;
      hasWorkouts: boolean;
    }> = [];
    for (let i = 0; i < totalDays; i++) {
      const day = addDays(monthRange.start, i);
      const dateKey = toYmd(day);
      out.push({
        dateKey,
        dayLabel: day.toLocaleDateString(undefined, { weekday: "short" }),
        dayNumber: String(day.getDate()),
        isToday: dateKey === todayKey,
        isActive: dateKey === selectedDateKey,
        hasWorkouts: dateKeysWithCheckIns.has(dateKey),
      });
    }
    return out;
  }, [dateKeysWithCheckIns, monthRange.end, monthRange.start, selectedDateKey, todayKey]);

  const goPrevMonth = useCallback(() => {
    const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1);
    setMonthCursor(next);
    setSelectedDateKey((prev) => {
      const current = new Date(`${prev}T00:00:00`);
      const day = Math.min(
        current.getDate(),
        new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      );
      return toYmd(new Date(next.getFullYear(), next.getMonth(), day));
    });
  }, [monthCursor]);

  const goNextMonth = useCallback(() => {
    const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
    setMonthCursor(next);
    setSelectedDateKey((prev) => {
      const current = new Date(`${prev}T00:00:00`);
      const day = Math.min(
        current.getDate(),
        new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      );
      return toYmd(new Date(next.getFullYear(), next.getMonth(), day));
    });
  }, [monthCursor]);

  const setMonthYear = useCallback((monthIndex: number, year: number) => {
    const safeMonth = Math.max(0, Math.min(11, monthIndex));
    const safeYear = Math.max(1970, Math.min(2100, year));
    setMonthCursor(new Date(safeYear, safeMonth, 1));
    setSelectedDateKey((prev) => {
      const current = new Date(`${prev}T00:00:00`);
      const day = Math.min(
        current.getDate(),
        new Date(safeYear, safeMonth + 1, 0).getDate()
      );
      return toYmd(new Date(safeYear, safeMonth, day));
    });
  }, []);

  const reorderAfterTimeChange = useCallback(
    async (checkInId: string, newTimeRaw: string) => {
      const newTime = normalizeScheduleTime(newTimeRaw);
      const snapshot = rows;
      const merged = rows.map((r) =>
        r.id === checkInId ? { ...r, scheduledTime: newTime } : r
      );
      const sorted = sortDayRows(merged).map((r, index) => ({ ...r, sortOrder: index }));

      setRows(sorted);
      try {
        await Promise.all(
          sorted.map((r) =>
            reorderClientCheckin({
              checkInId: r.id,
              sortOrder: r.sortOrder,
              scheduledTime: r.scheduledTime,
              scheduledFor: selectedDateKey,
            })
          )
        );
        await Promise.all([loadMonthDots(), loadSelectedDay()]);
      } catch {
        setRows(snapshot);
        throw new Error("Failed to update check-in time");
      }
    },
    [loadMonthDots, rows, selectedDateKey]
  );

  const saveCheckIn = useCallback(
    async (input: {
      id: string | null;
      clientId: string;
      scheduledFor: string;
      scheduledTime: string | null;
      status: CheckInStatus;
      notes: string | null;
      metricSummary: string | null;
    }) => {
      await upsertClientCheckin({
        id: input.id,
        clientId: input.clientId,
        scheduledFor: input.scheduledFor,
        scheduledTime: input.scheduledTime,
        status: input.status,
        notes: input.notes,
        metricSummary: input.metricSummary,
        sortOrder: null,
      });
      await Promise.all([loadMonthDots(), loadSelectedDay()]);
    },
    [loadMonthDots, loadSelectedDay]
  );

  const removeCheckIn = useCallback(
    async (id: string) => {
      await deleteClientCheckin(id);
      await Promise.all([loadMonthDots(), loadSelectedDay()]);
    },
    [loadMonthDots, loadSelectedDay]
  );

  return {
    todayKey,
    selectedDateKey,
    setSelectedDateKey,
    monthLabel: monthRange.monthLabel,
    monthIndex: monthRange.monthIndex,
    year: monthRange.year,
    goPrevMonth,
    goNextMonth,
    setMonthYear,
    days,
    rows,
    isLoading,
    refreshing,
    error,
    onRefresh,
    reorderAfterTimeChange,
    saveCheckIn,
    removeCheckIn,
  };
}
