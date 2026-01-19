import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    createWorkoutDraft,
    fetchWorkoutDraftById,
    updateWorkoutDraft,
} from "../api/workoutDrafts.api";
import type { WorkoutSeries } from "../types";
import type { WorkoutDraftState } from "../types/workoutDraftState";

type Params = {
  initialSeries: WorkoutSeries[];
  draftId: string | null;
};

type Return = {
  series: WorkoutSeries[];
  setSeries: React.Dispatch<React.SetStateAction<WorkoutSeries[]>>;

  resolvedDraftId: string | null;

  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  saveDraft: () => Promise<{ draftId: string } | null>;
  discardToLastSaved: () => void;

  hasChanges: boolean;
};

function normalizeLoadedState(
  raw: any,
  fallbackSeries: WorkoutSeries[]
): WorkoutDraftState {
  const maybeSeries = raw?.series;
  if (!Array.isArray(maybeSeries)) {
    return { version: 1, series: fallbackSeries };
  }
  return {
    version: 1,
    series: maybeSeries as WorkoutSeries[],
  };
}

export function useWorkoutDraft({ initialSeries, draftId }: Params): Return {
  const [resolvedDraftId, setResolvedDraftId] = useState<string | null>(draftId);

  const [series, setSeries] = useState<WorkoutSeries[]>(initialSeries);
  const [isLoading, setIsLoading] = useState(Boolean(draftId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // last saved snapshot (for Discard)
  const lastSavedRef = useRef<WorkoutSeries[]>(initialSeries);
  const loadedOnceRef = useRef(false);

  const hasChanges = useMemo(() => {
    // cheap compare: stringify (good enough for draft state)
    try {
      return (
        JSON.stringify(series) !== JSON.stringify(lastSavedRef.current)
      );
    } catch {
      return true;
    }
  }, [series]);

  // Load draft if editing
  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!draftId) {
        // new flow
        loadedOnceRef.current = true;
        setResolvedDraftId(null);
        lastSavedRef.current = initialSeries;
        setSeries(initialSeries);
        setIsLoading(false);
        setError(null);
        return;
      }

      // already loaded once for same id -> ignore
      if (loadedOnceRef.current && resolvedDraftId === draftId) return;

      try {
        setIsLoading(true);
        setError(null);

        const row = await fetchWorkoutDraftById(draftId);
        if (!row) throw new Error("Draft not found");

        const parsed = normalizeLoadedState(row.state, initialSeries);

        if (!mounted) return;

        setResolvedDraftId(row.id);
        setSeries(parsed.series);
        lastSavedRef.current = parsed.series;
        loadedOnceRef.current = true;
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load draft");
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
  }, [draftId]);

  const discardToLastSaved = useCallback(() => {
    setSeries(lastSavedRef.current);
  }, []);

  const saveDraft = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload: WorkoutDraftState = {
        version: 1,
        series,
      };

      // If we have an existing draft -> update
      if (resolvedDraftId) {
        const updated = await updateWorkoutDraft(resolvedDraftId, payload);
        lastSavedRef.current = updated.state.series;
        setSeries(updated.state.series);
        return { draftId: updated.id };
      }

      // else create new
      const created = await createWorkoutDraft(payload);
      lastSavedRef.current = created.state.series;
      setSeries(created.state.series);
      setResolvedDraftId(created.id);
      return { draftId: created.id };
    } catch (e: any) {
      setError(e?.message ?? "Failed to save draft");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [resolvedDraftId, series]);

  return {
    series,
    setSeries,
    resolvedDraftId,
    isLoading,
    isSaving,
    error,
    saveDraft,
    discardToLastSaved,
    hasChanges,
  };
}
