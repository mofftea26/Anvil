import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/shared/supabase/client";

import type { ProgramTemplateState } from "@/features/library/types/programTemplate";
import { totalPlannedDayKeys } from "@/features/workouts/utils/programProgress";

import {
  listTrainerClientProgramAssignments,
  listTrainerClientWorkoutAssignments,
  type ClientProgramAssignmentRow,
  type ClientWorkoutAssignmentRow,
} from "../api/assignmentsApi";

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysYmd(startYmd: string, days: number): string {
  const [y, m, d] = startYmd.split("-").map((x) => Number(x));
  const ms = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0) + days * 86_400_000;
  const dt = new Date(ms);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function useClientAssignments(params: { trainerId: string; clientId: string }) {
  const [programRows, setProgramRows] = useState<ClientProgramAssignmentRow[]>([]);
  const [workoutRows, setWorkoutRows] = useState<ClientWorkoutAssignmentRow[]>([]);
  const [programTemplatesById, setProgramTemplatesById] = useState<
    Record<string, { title: string; durationWeeks: number | null; difficulty: string | null; state: ProgramTemplateState | null }>
  >({});
  const [workoutsById, setWorkoutsById] = useState<Record<string, { title: string }>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const from = addDaysYmd(todayYmd(), -14);
    const to = addDaysYmd(todayYmd(), 30);
    return { from, to };
  }, []);

  const refetch = useCallback(async () => {
    if (!params.trainerId || !params.clientId) return;
    setError(null);
    setLoading(true);
    try {
      const [programsRes, workoutsRes] = await Promise.allSettled([
        listTrainerClientProgramAssignments({ trainerId: params.trainerId, clientId: params.clientId }),
        listTrainerClientWorkoutAssignments({
          trainerId: params.trainerId,
          clientId: params.clientId,
          fromYmd: range.from,
          toYmd: range.to,
        }),
      ]);
      const programs =
        programsRes.status === "fulfilled" ? programsRes.value : ([] as ClientProgramAssignmentRow[]);
      const workouts =
        workoutsRes.status === "fulfilled" ? workoutsRes.value : ([] as ClientWorkoutAssignmentRow[]);
      if (programsRes.status === "rejected" && workoutsRes.status === "rejected") {
        throw new Error("Failed to load assignments");
      }

      setProgramRows(programs);
      setWorkoutRows(workouts);

      const programIds = Array.from(new Set(programs.map((p) => p.programtemplateid).filter(Boolean)));
      const workoutIds = Array.from(new Set(workouts.map((w) => w.workoutid).filter(Boolean)));

      const [tplRes, wRes] = await Promise.all([
        programIds.length
          ? supabase
              .from("programTemplates")
              .select("id,title,durationWeeks,difficulty,state")
              .in("id", programIds)
          : Promise.resolve({ data: [], error: null } as any),
        workoutIds.length
          ? supabase
              .from("workouts")
              .select("id,title")
              .in("id", workoutIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);
      if (tplRes.error) throw tplRes.error;
      if (wRes.error) throw wRes.error;

      const nextTpl: any = {};
      for (const r of (tplRes.data ?? []) as any[]) {
        nextTpl[String(r.id)] = {
          title: String(r.title ?? "Program"),
          durationWeeks: (r.durationWeeks as number | null) ?? null,
          difficulty: (r.difficulty as string | null) ?? null,
          state: (r.state as ProgramTemplateState | null) ?? null,
        };
      }
      const nextW: any = {};
      for (const r of (wRes.data ?? []) as any[]) nextW[String(r.id)] = { title: String(r.title ?? "Workout") };

      setProgramTemplatesById(nextTpl);
      setWorkoutsById(nextW);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [params.clientId, params.trainerId, range.from, range.to]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refreshing]);

  const programCards = useMemo(() => {
    return programRows.map((p) => {
      const tpl = programTemplatesById[p.programtemplateid] ?? null;
      const completedDayKeys = Array.isArray((p.progress as any)?.completedDayKeys) ? (p.progress as any).completedDayKeys : [];
      const totalDays = tpl?.state ? totalPlannedDayKeys(tpl.state).length : 0;
      const completed = Array.from(new Set(completedDayKeys.filter((x: any) => typeof x === "string"))).length;
      const percent = totalDays ? Math.floor((completed / totalDays) * 100) : 0;
      return { row: p, template: tpl, progress: { completed, totalDays, percent } };
    });
  }, [programRows, programTemplatesById]);

  const workoutCards = useMemo(() => {
    return workoutRows.map((w) => ({
      row: w,
      title: workoutsById[w.workoutid]?.title ?? "Workout",
      isManual: w.programassignmentid == null,
    }));
  }, [workoutRows, workoutsById]);

  return {
    loading,
    refreshing,
    error,
    refetch,
    onRefresh,
    range,
    programCards,
    workoutCards,
  };
}

