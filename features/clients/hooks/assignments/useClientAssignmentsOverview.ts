import { useCallback, useEffect, useMemo, useState } from "react";

import { appToast } from "@/shared/ui";
import { useAppSelector } from "@/shared/hooks/useAppSelector";

import {
  listClientProgramAssignmentsForTrainer,
  listClientWorkoutAssignmentsForTrainer,
} from "../../api/assignments.api";
import type { TrainerClientProgramAssignmentRow, ClientWorkoutAssignmentRow } from "../../types/assignments";

function startYmdDaysFromNow(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useClientAssignmentsOverview(params: { clientId: string }) {
  const trainerId = useAppSelector((s) => s.auth.userId ?? "");
  const [workoutAssignments, setWorkoutAssignments] = useState<ClientWorkoutAssignmentRow[]>([]);
  const [programAssignments, setProgramAssignments] = useState<TrainerClientProgramAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!trainerId || !params.clientId) return;
    setLoading(true);
    setError(null);
    try {
      const startYmd = startYmdDaysFromNow(-14);
      const endYmd = startYmdDaysFromNow(30);
      const [workouts, programs] = await Promise.all([
        listClientWorkoutAssignmentsForTrainer({
          trainerId,
          clientId: params.clientId,
          startYmd,
          endYmd,
        }),
        listClientProgramAssignmentsForTrainer({
          trainerId,
          clientId: params.clientId,
        }).catch(() => [] as TrainerClientProgramAssignmentRow[]),
      ]);
      setWorkoutAssignments(workouts);
      setProgramAssignments(programs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [params.clientId, trainerId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const showErrorToast = useCallback(() => {
    if (error) appToast.error(error);
  }, [error]);

  const upcomingWorkouts = useMemo(
    () =>
      workoutAssignments
        .slice()
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [workoutAssignments]
  );

  return {
    trainerId,
    loading,
    error,
    showErrorToast,
    refetch,
    workoutAssignments: upcomingWorkouts,
    programAssignments,
  };
}

