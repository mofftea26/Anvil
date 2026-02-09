import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/shared/supabase/client";

export type PublicProgramTemplate = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  durationWeeks: number | null;
  state: unknown | null;
};

export function useProgramTemplatesPublicMap(programTemplateIds: string[]) {
  const ids = useMemo(
    () => Array.from(new Set(programTemplateIds.filter(Boolean))).sort(),
    [programTemplateIds]
  );
  const idsKey = useMemo(() => ids.join("|"), [ids]);

  const [map, setMap] = useState<Record<string, PublicProgramTemplate>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!ids.length) {
        setMap({});
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("programTemplates")
          .select("id,title,description,difficulty,durationWeeks,state")
          .in("id", ids);
        if (error) throw error;
        const next: Record<string, PublicProgramTemplate> = {};
        for (const r of (data ?? []) as any[]) {
          next[String(r.id)] = {
            id: String(r.id),
            title: String(r.title ?? "Program"),
            description: (r.description as string | null) ?? null,
            difficulty: (r.difficulty as string | null) ?? null,
            durationWeeks: (r.durationWeeks as number | null) ?? null,
            state: (r.state as unknown | null) ?? null,
          };
        }
        if (!cancelled) setMap(next);
      } catch {
        if (!cancelled) setMap({});
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

