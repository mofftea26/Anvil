import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutsByTrainer } from "@/features/builder/api/workouts.api";
import {
  fetchProgramTemplateById,
  updateProgramTemplate,
} from "@/features/library/api/programTemplates.api";
import type {
  ProgramDifficulty,
  ProgramTemplate,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { appToast } from "@/shared/ui";
import { useCallback, useEffect, useRef, useState } from "react";

import { DEBOUNCE_MS } from "../constants";

type PersistPatch = {
  title?: string;
  difficulty?: ProgramDifficulty;
  state?: ProgramTemplateState;
};

export function useProgramTemplateEditorData(params: {
  programId: string;
  trainerId: string;
}) {
  const { programId, trainerId } = params;

  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>("beginner");
  const [state, setState] = useState<ProgramTemplateState | null>(null);
  const [workoutRowsMap, setWorkoutRowsMap] = useState<
    Record<string, WorkoutRow>
  >({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (patch: PersistPatch) => {
      if (!programId) return;
      try {
        const updated = await updateProgramTemplate(programId, patch);
        setTemplate(updated);
        setTitle(updated.title);
        setDifficulty(updated.difficulty);
        setState(updated.state);
      } catch (e: unknown) {
        appToast.error(e instanceof Error ? e.message : "Failed to save");
      }
    },
    [programId]
  );

  const schedulePersist = useCallback(
    (patch: PersistPatch) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void persist(patch);
      }, DEBOUNCE_MS);
    },
    [persist]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!programId) {
        setError("Missing program");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [row, workouts] = await Promise.all([
          fetchProgramTemplateById(programId),
          trainerId ? fetchWorkoutsByTrainer(trainerId) : Promise.resolve([]),
        ]);
        if (!mounted) return;
        if (!row) {
          setError("Program not found");
          setTemplate(null);
          setState(null);
          setLoading(false);
          return;
        }
        setTemplate(row);
        setTitle(row.title);
        setDifficulty(row.difficulty);
        setState(row.state);
        const ids = row.state?.workoutLibrary?.linkedWorkoutIds ?? [];
        const map: Record<string, WorkoutRow> = {};
        workouts.forEach((w) => {
          if (ids.includes(w.id)) map[w.id] = w;
        });
        setWorkoutRowsMap(map);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setTemplate(null);
        setState(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [programId, trainerId]);

  return {
    template,
    loading,
    error,
    title,
    setTitle,
    difficulty,
    setDifficulty,
    state,
    setState,
    workoutRowsMap,
    setWorkoutRowsMap,
    schedulePersist,
    persist,
  };
}
