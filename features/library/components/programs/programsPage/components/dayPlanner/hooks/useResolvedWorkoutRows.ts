import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutById } from "@/features/builder/api/workouts.api";
import type {
  ProgramDay,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { useEffect, useState } from "react";

import { refToWorkoutRow } from "../utils/refToWorkoutRow";

export function useResolvedWorkoutRows(params: {
  visible: boolean;
  day: ProgramDay | null;
  state: ProgramTemplateState | null;
  workoutRowsMap: Record<string, WorkoutRow>;
}) {
  const { visible, day, state, workoutRowsMap } = params;
  const [resolvedRows, setResolvedRows] = useState<(WorkoutRow | null)[]>([]);

  const refs = day?.workouts ?? (day?.workoutRef ? [day.workoutRef] : []);
  const count = refs.length;

  useEffect(() => {
    if (!visible || !day) {
      setResolvedRows([]);
      return;
    }
    const list = day.workouts ?? (day.workoutRef ? [day.workoutRef] : []);
    if (list.length === 0) {
      setResolvedRows([]);
      return;
    }
    const inline = state?.workoutLibrary?.inlineWorkouts ?? [];
    const initial = list.map((ref) =>
      refToWorkoutRow(ref, workoutRowsMap, inline)
    );
    setResolvedRows(initial);

    list.forEach((ref, i) => {
      if (initial[i] != null) return;
      if (ref?.source === "workoutsTable") {
        fetchWorkoutById(ref.workoutId).then((row) => {
          setResolvedRows((prev) => {
            const next = [...prev];
            if (i < next.length) next[i] = row ?? null;
            return next;
          });
        });
      }
    });
  }, [
    visible,
    day?.id,
    count,
    state?.workoutLibrary?.inlineWorkouts,
    workoutRowsMap,
    day,
  ]);

  return { resolvedRows, count };
}
