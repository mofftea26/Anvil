import { useCallback, useEffect, useMemo, useState } from "react";

import { appToast } from "@/shared/ui";

import {
  listClientWorkoutAssignments,
  listWorkoutSessions,
  listWorkoutSetLogs,
} from "../api/clientWorkouts.api";
import type { WorkoutSession } from "../types";
import type { WorkoutSetLog } from "../types";
import { calculateTotalVolume } from "../utils/workoutMetrics";

function startYmdDaysAgo(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  // ISO week-ish key: year + weekStart Monday date
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function useClientWorkoutStats(params: { clientId: string }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [volumeTotal, setVolumeTotal] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startYmd = useMemo(() => startYmdDaysAgo(28), []);
  const endYmd = useMemo(() => startYmdDaysAgo(0), []); // today

  const refetch = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [sess, assignments] = await Promise.all([
        listWorkoutSessions({ clientId: params.clientId, startIso: new Date(startYmd).toISOString(), endIso: new Date().toISOString(), limit: 80 }),
        listClientWorkoutAssignments({ clientId: params.clientId, startYmd, endYmd }),
      ]);

      setSessions(sess);
      setAssignedCount(assignments.length);

      // Fetch logs for a limited number of sessions to keep MVP snappy.
      const limited = sess.slice(0, 30);
      const logsBySession: WorkoutSetLog[][] = await Promise.all(
        limited.map((s) => listWorkoutSetLogs(s.id).catch(() => [] as WorkoutSetLog[]))
      );
      const vol = logsBySession.reduce(
        (sum, logs) => sum + calculateTotalVolume(logs),
        0
      );
      setVolumeTotal(vol);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  }, [endYmd, params.clientId, startYmd]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const showErrorToast = useCallback(() => {
    if (error) appToast.error(error);
  }, [error]);

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === "completed"),
    [sessions]
  );

  const avgDurationSec = useMemo(() => {
    const list = completedSessions
      .map((s) => s.durationSec ?? 0)
      .filter((x) => Number.isFinite(x) && x > 0);
    if (list.length === 0) return 0;
    return Math.round(list.reduce((a, b) => a + b, 0) / list.length);
  }, [completedSessions]);

  const adherence = useMemo(() => {
    if (assignedCount <= 0) return 0;
    return Math.min(1, completedSessions.length / assignedCount);
  }, [assignedCount, completedSessions.length]);

  const sessionsPerWeek = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of completedSessions) {
      const k = weekKey(s.startedAt);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({ week: k, count: map.get(k) ?? 0 }));
  }, [completedSessions]);

  return {
    isLoading,
    error,
    showErrorToast,
    refetch,
    assignedCount,
    completedCount: completedSessions.length,
    adherence,
    avgDurationSec,
    volumeTotal,
    sessionsPerWeek,
  };
}

