import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWorkout, fetchWorkoutById, updateWorkout } from "../api/workouts.api";
import type { WorkoutSeries } from "../types";
import type { WorkoutState } from "../types/workoutState";

type Params = {
  mode: "new" | "edit";
  workoutId: string | null;
  initialSeries: WorkoutSeries[];
};

type Return = {
  series: WorkoutSeries[];
  setSeries: React.Dispatch<React.SetStateAction<WorkoutSeries[]>>;

  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  save: () => Promise<{ workoutId: string } | null>;
  discardToLastSaved: () => void;
  hasChanges: boolean;
};

function normalizeLoadedState(raw: any, fallbackSeries: WorkoutSeries[]): WorkoutState {
  const maybeSeries = raw?.series;
  if (!Array.isArray(maybeSeries)) {
    return { version: 1, series: fallbackSeries };
  }
  return { version: 1, series: maybeSeries as WorkoutSeries[] };
}

export function useWorkoutEditor({
  mode,
  workoutId,
  initialSeries,
}: Params): Return {
  const [series, setSeries] = useState<WorkoutSeries[]>(initialSeries);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSavedRef = useRef<WorkoutSeries[]>(initialSeries);
  const loadedOnceRef = useRef(false);

  const hasChanges = useMemo(() => {
    try {
      return JSON.stringify(series) !== JSON.stringify(lastSavedRef.current);
    } catch {
      return true;
    }
  }, [series]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (mode !== "edit") {
        loadedOnceRef.current = true;
        lastSavedRef.current = initialSeries;
        setSeries(initialSeries);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!workoutId) {
        setError("Missing workoutId");
        setIsLoading(false);
        return;
      }

      if (loadedOnceRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        const row = await fetchWorkoutById(workoutId);
        if (!row) throw new Error("Workout not found");

        const parsed = normalizeLoadedState(row.state, initialSeries);

        if (!mounted) return;
        setSeries(parsed.series);
        lastSavedRef.current = parsed.series;
        loadedOnceRef.current = true;
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load workout");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, workoutId]);

  const discardToLastSaved = useCallback(() => {
    setSeries(lastSavedRef.current);
  }, []);

  const save = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload: WorkoutState = { version: 1, series };

      if (mode === "new") {
        const created = await createWorkout({
          title: "Workout",
          state: payload,
        });
        lastSavedRef.current = created.state.series;
        setSeries(created.state.series);
        return { workoutId: created.id };
      }

      if (!workoutId) throw new Error("Missing workoutId");

      const updated = await updateWorkout({
        workoutId,
        state: payload,
      });
      lastSavedRef.current = updated.state.series;
      setSeries(updated.state.series);
      return { workoutId: updated.id };
    } catch (e: any) {
      setError(e?.message ?? "Failed to save workout");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [mode, workoutId, series]);

  return {
    series,
    setSeries,
    isLoading,
    isSaving,
    error,
    save,
    discardToLastSaved,
    hasChanges,
  };
}

