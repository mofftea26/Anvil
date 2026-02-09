import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/shared/supabase/client";

import type { ClientWorkoutAssignment } from "@/features/workouts/types";
import type { DayWorkoutRef, ProgramDay, ProgramTemplateState } from "@/features/library/types/programTemplate";

type ActiveProgramRow = {
  clientid: string;
  id: string;
  programtemplateid: string;
  startdate: string;
};

type RawWorkoutAssignmentRow = {
  id: string;
  trainerid: string;
  clientid: string;
  workouttemplateid: string;
  scheduledfor: string; // YYYY-MM-DD
  status: string | null;
  source: string | null;
  programassignmentid: string | null;
  programdaykey: string | null;
};

function toWorkoutAssignment(row: RawWorkoutAssignmentRow): ClientWorkoutAssignment {
  return {
    id: row.id,
    trainerId: row.trainerid,
    clientId: row.clientid,
    workoutTemplateId: row.workouttemplateid,
    scheduledFor: row.scheduledfor,
    status: (row.status as any) ?? null,
    source: row.source ?? null,
    programAssignmentId: row.programassignmentid ?? null,
    programDayKey: row.programdaykey ?? null,
  };
}

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ymdToUtcNoonMs(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

function diffDaysYmd(aYmd: string, bYmd: string): number {
  const a = ymdToUtcNoonMs(aYmd);
  const b = ymdToUtcNoonMs(bYmd);
  return Math.floor((a - b) / 86_400_000);
}

function refsForDay(day: ProgramDay): DayWorkoutRef[] {
  if (Array.isArray(day.workouts) && day.workouts.length) return day.workouts;
  return day.workoutRef ? [day.workoutRef] : [];
}

function workoutIdFromRefs(refs: DayWorkoutRef[] | null | undefined): string | null {
  if (!refs?.length) return null;
  for (const r of refs) {
    if (r && r.source === "workoutsTable" && typeof (r as any).workoutId === "string") {
      return (r as any).workoutId as string;
    }
  }
  return null;
}

function workoutIdForProgramToday(params: {
  state: ProgramTemplateState;
  startDate: string; // YYYY-MM-DD
  today: string; // YYYY-MM-DD
}): { workoutTemplateId: string; programDayKey: string | null } | null {
  const offset = diffDaysYmd(params.today, params.startDate);
  if (!Number.isFinite(offset) || offset < 0) return null;

  let i = 0;
  for (const phase of params.state.phases ?? []) {
    for (const week of phase.weeks ?? []) {
      for (const day of week.days ?? []) {
        if (i === offset) {
          const workoutId = workoutIdFromRefs(refsForDay(day));
          if (!workoutId) return null;
          return { workoutTemplateId: workoutId, programDayKey: day.id ?? null };
        }
        i += 1;
      }
    }
  }
  return null;
}

export function useTrainerClientsAssignmentsSummary(params: {
  trainerId: string;
  clientIds: string[];
  /** Increment to force a refetch after mutations. */
  refreshToken?: number;
}) {
  const ids = useMemo(
    () => Array.from(new Set(params.clientIds.filter(Boolean))).sort(),
    [params.clientIds]
  );
  const idsKey = useMemo(() => ids.join("|"), [ids]);
  const ymd = useMemo(() => todayYmd(), []);

  const [loading, setLoading] = useState(false);
  const [activePrograms, setActivePrograms] = useState<Record<string, ActiveProgramRow>>({});
  const [todayWorkouts, setTodayWorkouts] = useState<Record<string, ClientWorkoutAssignment>>({});
  const [programTitleById, setProgramTitleById] = useState<Record<string, string>>({});
  const [workoutTitleById, setWorkoutTitleById] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!params.trainerId || !ids.length) {
        setActivePrograms({});
        setTodayWorkouts({});
        return;
      }
      setLoading(true);
      try {
        const [programRes, workoutRes] = await Promise.all([
          supabase
            .from("clientProgramAssignments")
            .select("id,clientid,programtemplateid,startdate,status")
            .eq("trainerid", params.trainerId)
            .in("clientid", ids)
            .eq("status", "active"),
          supabase
            .from("clientWorkoutAssignments")
            .select("*")
            .eq("trainerid", params.trainerId)
            .in("clientid", ids)
            .eq("scheduledfor", ymd),
        ]);

        if (cancelled) return;
        if (programRes.error) throw programRes.error;
        // Workout query can fail due to RLS/column policies; don't drop program info if it does.
        const workoutRows = workoutRes.error ? [] : (workoutRes.data ?? []);

        const activeMap: Record<string, ActiveProgramRow> = {};
        for (const r of (programRes.data ?? []) as any[]) {
          activeMap[r.clientid] = {
            id: r.id,
            clientid: r.clientid,
            programtemplateid: r.programtemplateid,
            startdate: r.startdate,
          };
        }
        const workoutsMap: Record<string, ClientWorkoutAssignment> = {};
        for (const r of workoutRows as RawWorkoutAssignmentRow[]) {
          workoutsMap[r.clientid] = toWorkoutAssignment(r);
        }

        // Derive today's workout from the active program state if we don't have an explicit assignment row.
        // (Do NOT write to DB here; cards should be side-effect free.)
        const missingFromProgram = Object.values(activeMap).filter((p) => !workoutsMap[p.clientid]);
        if (missingFromProgram.length) {
          try {
            const programIds = Array.from(
              new Set(missingFromProgram.map((x) => x.programtemplateid).filter(Boolean))
            );
            const tplRes = programIds.length
              ? await supabase.from("programTemplates").select("id,state").in("id", programIds)
              : ({ data: [], error: null } as any);
            if (tplRes.error) throw tplRes.error;
            const stateById: Record<string, ProgramTemplateState> = {};
            for (const r of (tplRes.data ?? []) as any[]) {
              if (r?.id && r?.state) stateById[String(r.id)] = r.state as ProgramTemplateState;
            }

            for (const p of missingFromProgram) {
              const state = stateById[p.programtemplateid];
              if (!state) continue;
              const hit = workoutIdForProgramToday({ state, startDate: p.startdate, today: ymd });
              if (!hit) continue;
              workoutsMap[p.clientid] = {
                id: `planned_${p.id}_${ymd}`,
                trainerId: params.trainerId,
                clientId: p.clientid,
                workoutTemplateId: hit.workoutTemplateId,
                scheduledFor: ymd,
                status: "assigned",
                source: "program",
                programAssignmentId: p.id,
                programDayKey: hit.programDayKey,
              };
            }
          } catch (e) {
            console.log("[useTrainerClientsAssignmentsSummary] derive program workout failed", e);
          }
        }

        const programIds = Array.from(
          new Set(Object.values(activeMap).map((x) => x.programtemplateid).filter(Boolean))
        );
        const workoutIds = Array.from(
          new Set(Object.values(workoutsMap).map((x) => x.workoutTemplateId).filter(Boolean))
        );

        // Titles are optional; never fail the whole summary if they error.
        let pTitle: Record<string, string> = {};
        let wTitle: Record<string, string> = {};
        try {
          const [programTitlesRes, workoutTitlesRes] = await Promise.all([
            programIds.length
              ? supabase
                  .from("programTemplates")
                  .select("id,title")
                  .in("id", programIds)
              : Promise.resolve({ data: [], error: null } as any),
            workoutIds.length
              ? supabase
                  .from("workouts")
                  .select("id,title")
                  .in("id", workoutIds)
              : Promise.resolve({ data: [], error: null } as any),
          ]);

          if (programTitlesRes.error) throw programTitlesRes.error;
          if (workoutTitlesRes.error) throw workoutTitlesRes.error;
          for (const r of (programTitlesRes.data ?? []) as any[]) pTitle[r.id] = r.title ?? "Program";
          for (const r of (workoutTitlesRes.data ?? []) as any[]) wTitle[r.id] = r.title ?? "Workout";
        } catch (e) {
          console.log("[useTrainerClientsAssignmentsSummary] title fetch failed", e);
        }

        setActivePrograms(activeMap);
        setTodayWorkouts(workoutsMap);
        setProgramTitleById(pTitle);
        setWorkoutTitleById(wTitle);
      } catch {
        if (!cancelled) {
          // If the core program query fails we can't show assignment state reliably.
          // Keep previous state rather than flashing back to "Assign" + "Rest".
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [idsKey, ids, params.trainerId, ymd, params.refreshToken]);

  return {
    loading,
    activeProgramsByClientId: activePrograms,
    todayWorkoutByClientId: todayWorkouts,
    programTitleById,
    workoutTitleById,
    todayYmd: ymd,
  };
}

