import { useCallback, useEffect, useMemo, useState } from "react";

import { appToast } from "@/shared/ui";

import {
  fetchWorkoutSessionById,
  fetchWorkoutTemplateById,
  listWorkoutSetLogs,
} from "../api/clientWorkouts.api";
import type { WorkoutSession, WorkoutSetLog, WorkoutTemplate } from "../types";
import { calculateTotalVolume } from "../utils/workoutMetrics";

export type SessionExerciseGroup = {
  exerciseId: string;
  title: string;
  logs: WorkoutSetLog[];
};

export function useWorkoutSessionDetails(sessionId: string) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [logs, setLogs] = useState<WorkoutSetLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const s = await fetchWorkoutSessionById(sessionId);
      setSession(s);
      if (s?.workoutTemplateId) {
        const tpl = await fetchWorkoutTemplateById(s.workoutTemplateId);
        setTemplate(tpl);
      } else {
        setTemplate(null);
      }
      if (s?.id) {
        const l = await listWorkoutSetLogs(s.id);
        setLogs(l);
      } else {
        setLogs([]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const showErrorToast = useCallback(() => {
    if (error) appToast.error(error);
  }, [error]);

  const volume = useMemo(() => calculateTotalVolume(logs), [logs]);

  const groups = useMemo<SessionExerciseGroup[]>(() => {
    const exerciseTitleById = new Map<string, string>();
    for (const block of template?.state?.series ?? []) {
      for (const ex of block.exercises ?? []) {
        exerciseTitleById.set(ex.id, ex.title);
      }
    }
    const byEx = new Map<string, WorkoutSetLog[]>();
    for (const l of logs) {
      const exId = l.seriesExerciseId;
      if (!exId) continue;
      const arr = byEx.get(exId);
      if (arr) arr.push(l);
      else byEx.set(exId, [l]);
    }
    const out: SessionExerciseGroup[] = [];
    byEx.forEach((arr, exId) => {
      out.push({
        exerciseId: exId,
        title: exerciseTitleById.get(exId) ?? "Exercise",
        logs: arr.slice().sort((a, b) => a.setIndex - b.setIndex),
      });
    });
    // stable order: by template order when possible
    const order: string[] = [];
    for (const block of template?.state?.series ?? []) {
      for (const ex of block.exercises ?? []) order.push(ex.id);
    }
    out.sort((a, b) => {
      const ia = order.indexOf(a.exerciseId);
      const ib = order.indexOf(b.exerciseId);
      if (ia === -1 && ib === -1) return a.title.localeCompare(b.title);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return out;
  }, [logs, template?.state]);

  return { session, template, logs, groups, volume, isLoading, error, showErrorToast, refetch };
}

