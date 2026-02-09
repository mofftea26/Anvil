import { useEffect, useMemo, useState } from "react";

import { useAppSelector } from "@/shared/hooks/useAppSelector";

import { listProgramAssignmentStatsByTemplateIds } from "../../api/assignments.api";

export function useProgramAssignmentStats(programTemplateIds: string[]) {
  const trainerId = useAppSelector((s) => s.auth.userId ?? "");
  const ids = useMemo(
    () => Array.from(new Set(programTemplateIds.filter(Boolean))).sort(),
    [programTemplateIds]
  );
  const idsKey = useMemo(() => ids.join("|"), [ids]);

  const [map, setMap] = useState<Record<string, { doing: number; finished: number }>>({});

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!trainerId || !ids.length) {
        setMap({});
        return;
      }
      try {
        const next = await listProgramAssignmentStatsByTemplateIds({
          trainerId,
          programTemplateIds: ids,
        });
        if (!cancelled) setMap(next);
      } catch {
        if (!cancelled) setMap({});
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [idsKey, ids, trainerId]);

  return { assignmentStatsByProgramId: map };
}

