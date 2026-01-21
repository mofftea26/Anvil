import { router } from "expo-router";
import React, { useCallback, useState } from "react";

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { usePublishedWorkouts } from "@/features/library/hooks/usePublishedWorkouts";
import { useAppSelector } from "@/shared/hooks/useAppSelector";

type UseWorkoutsResult = {
  rows: WorkoutRow[];
  isLoading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onAddWorkout: () => void;
  onOpenWorkout: (id: string) => void;
};

export function useWorkouts(): UseWorkoutsResult {
  const auth = useAppSelector((s) => s.auth);
  const trainerId = auth.userId ?? "";

  const { rows, isLoading, error, refetch } = usePublishedWorkouts(trainerId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onAddWorkout = useCallback(() => {
    router.push("/(trainer)/library/workout-builder/new" as Parameters<typeof router.push>[0]);
  }, []);

  const onOpenWorkout = useCallback((id: string) => {
    router.push(
      `/(trainer)/library/workout-builder/${id}` as Parameters<typeof router.push>[0]
    );
  }, []);

  return {
    rows,
    isLoading,
    error,
    refreshing,
    onRefresh,
    onAddWorkout,
    onOpenWorkout,
  };
}
