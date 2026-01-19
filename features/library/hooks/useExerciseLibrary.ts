import { supabase } from "@/shared/supabase/client";
import { useEffect, useMemo, useState } from "react";

export type ExerciseLibraryRow = {
  id: string;
  title: string;
  imageUrl: string | null;
  videoUrl: string | null;
  primaryTargetMuscle: string | null;
};

type UseExerciseLibraryParams = {
  search: string;
  targetMuscle?: string | null;
};

export function useExerciseLibrary(params: UseExerciseLibraryParams) {
  const [rows, setRows] = useState<ExerciseLibraryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);
      setError(null);

      // NOTE: this assumes the exercises table exists.
      // If you dropped it, it will show the error nicely in the UI (no crash).
      let q = supabase
        .from("exercises")
        .select("id,title,imageUrl,videoUrl,primaryTargetMuscle")
        .order("title", { ascending: true });

      const s = params.search.trim();
      if (s.length > 0) q = q.ilike("title", `%${s}%`);

      if (params.targetMuscle) {
        q = q.eq("primaryTargetMuscle", params.targetMuscle);
      }

      const { data, error } = await q;

      if (!isMounted) return;

      if (error) {
        setError(error.message);
        setRows([]);
        setIsLoading(false);
        return;
      }

      setRows((data ?? []) as ExerciseLibraryRow[]);
      setIsLoading(false);
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [params.search, params.targetMuscle]);

  return useMemo(
    () => ({ rows, isLoading, error }),
    [rows, isLoading, error]
  );
}
