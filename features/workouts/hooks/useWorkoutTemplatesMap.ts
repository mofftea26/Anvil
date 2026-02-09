import { useEffect, useMemo, useRef, useState } from "react";

import { fetchWorkoutTemplateById } from "../api/clientWorkouts.api";
import type { WorkoutTemplate } from "../types";

export function useWorkoutTemplatesMap(templateIds: string[]) {
  const ids = useMemo(
    () => Array.from(new Set(templateIds.filter(Boolean))).sort(),
    [templateIds]
  );
  const [map, setMap] = useState<Record<string, WorkoutTemplate>>({});
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  const idsKey = useMemo(() => ids.join("|"), [ids]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (ids.length === 0) return;
      setLoading(true);
      try {
        const missing = ids.filter((id) => !mapRef.current[id]);
        if (missing.length === 0) return;
        const fetched = await Promise.all(missing.map((id) => fetchWorkoutTemplateById(id)));
        if (cancelled) return;
        setMap((prev) => {
          const next = { ...prev };
          for (const tpl of fetched) {
            if (tpl) next[tpl.id] = tpl;
          }
          return next;
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [idsKey, ids]);

  return { templatesById: map, loading };
}

