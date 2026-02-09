import { useEffect, useMemo, useRef, useState } from "react";

import { fetchProgramTemplateById } from "@/features/library/api/programTemplates.api";
import type { ProgramTemplate } from "@/features/library/types/programTemplate";

export function useProgramTemplatesMap(programTemplateIds: string[]) {
  const ids = useMemo(
    () => Array.from(new Set(programTemplateIds.filter(Boolean))).sort(),
    [programTemplateIds]
  );
  const idsKey = useMemo(() => ids.join("|"), [ids]);

  const [map, setMap] = useState<Record<string, ProgramTemplate>>({});
  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!ids.length) return;
      const missing = ids.filter((id) => !mapRef.current[id]);
      if (!missing.length) return;
      const fetched = await Promise.all(missing.map((id) => fetchProgramTemplateById(id)));
      if (cancelled) return;
      setMap((prev) => {
        const next = { ...prev };
        for (const tpl of fetched) {
          if (tpl) next[tpl.id] = tpl;
        }
        return next;
      });
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [idsKey, ids]);

  return { templatesById: map };
}

