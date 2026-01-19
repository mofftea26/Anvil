import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutsByTrainer } from "@/features/builder/api/workouts.api";

type Result = {
  rows: WorkoutRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function usePublishedWorkouts(trainerId: string): Result {
  const [rows, setRows] = useState<WorkoutRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!trainerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const next = await fetchWorkoutsByTrainer(trainerId);
      setRows(next);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load workouts");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    if (!trainerId) {
      setRows([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    refetch();
  }, [trainerId, refetch]);

  return useMemo(
    () => ({ rows, isLoading, error, refetch }),
    [rows, isLoading, error, refetch]
  );
}

