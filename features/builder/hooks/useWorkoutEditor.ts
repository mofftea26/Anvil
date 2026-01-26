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
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;

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
  const [title, setTitle] = useState<string>("Workout");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSavedRef = useRef<{ series: WorkoutSeries[]; title: string }>({
    series: initialSeries,
    title: "Workout",
  });
  const loadedOnceRef = useRef(false);

  const hasChanges = useMemo(() => {
    try {
      return (
        JSON.stringify(series) !== JSON.stringify(lastSavedRef.current.series) ||
        title !== lastSavedRef.current.title
      );
    } catch {
      return true;
    }
  }, [series, title]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (mode !== "edit") {
        loadedOnceRef.current = true;
        lastSavedRef.current = { series: initialSeries, title: "Workout" };
        setSeries(initialSeries);
        setTitle("Workout");
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
        setTitle(row.title || "Workout");
        lastSavedRef.current = { series: parsed.series, title: row.title || "Workout" };
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
    // Create deep copies to ensure React detects the change
    const savedSeries = JSON.parse(JSON.stringify(lastSavedRef.current.series));
    const savedTitle = lastSavedRef.current.title;
    setSeries(savedSeries);
    setTitle(savedTitle);
  }, []);

  const save = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload: WorkoutState = { version: 1, series };

      if (mode === "new") {
        const created = await createWorkout({
          title: title.trim() || "Workout",
          state: payload,
        });
        lastSavedRef.current = { series: created.state.series, title: created.title };
        setSeries(created.state.series);
        setTitle(created.title);
        return { workoutId: created.id };
      }

      if (!workoutId) throw new Error("Missing workoutId");

      const updated = await updateWorkout({
        workoutId,
        title: title.trim() || "Workout",
        state: payload,
      });
      lastSavedRef.current = { series: updated.state.series, title: updated.title };
      setSeries(updated.state.series);
      setTitle(updated.title);
      return { workoutId: updated.id };
    } catch (e: any) {
      setError(e?.message ?? "Failed to save workout");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [mode, workoutId, series, title]);

  return {
    series,
    setSeries,
    title,
    setTitle,
    isLoading,
    isSaving,
    error,
    save,
    discardToLastSaved,
    hasChanges,
  };
}

