import { useCallback, useEffect, useMemo, useState } from "react";

import { appToast } from "@/shared/ui";

import { fetchClientWorkoutAssignmentById, fetchWorkoutTemplateById } from "../api/clientWorkouts.api";
import type { ClientWorkoutAssignment, WorkoutTemplate } from "../types";

export function useAssignedWorkout(assignmentId: string) {
  const [assignment, setAssignment] = useState<ClientWorkoutAssignment | null>(null);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workoutTemplateId = assignment?.workoutTemplateId ?? null;

  const refetch = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const a = await fetchClientWorkoutAssignmentById(assignmentId);
      setAssignment(a);
      if (a?.workoutTemplateId) {
        const tpl = await fetchWorkoutTemplateById(a.workoutTemplateId);
        setTemplate(tpl);
      } else {
        setTemplate(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load workout");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const showErrorToast = useCallback(() => {
    if (error) appToast.error(error);
  }, [error]);

  const canRun = useMemo(
    () => !!assignment?.id && !!workoutTemplateId,
    [assignment?.id, workoutTemplateId]
  );

  return { assignment, template, isLoading, error, showErrorToast, refetch, canRun };
}

