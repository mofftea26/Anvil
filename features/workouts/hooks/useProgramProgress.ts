import { useCallback, useEffect, useState } from "react";

import {
  fetchActiveProgramDetail,
  fetchProgramProgressDays,
} from "../api/programProgress.api";
import type { ActiveProgramDetail, ProgramProgressDay } from "../types";

export type UseProgramProgressOptions = {
  /** Default true. When false, skips `anvil_get_program_progress`. */
  includeDays?: boolean;
  /** Default true. When false, skips `anvil_get_active_program_detail`. */
  includeDetail?: boolean;
};

export type UseProgramProgressResult = {
  days: ProgramProgressDay[];
  detail: ActiveProgramDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Loads program calendar rows and/or the aggregate detail row for a program assignment.
 * Used by `ProgramProgressScreen` (both) and `ClientMyProgramScreen` (detail only).
 */
export function useProgramProgress(
  programAssignmentId: string | null | undefined,
  options: UseProgramProgressOptions = {}
): UseProgramProgressResult {
  const includeDays = options.includeDays !== false;
  const includeDetail = options.includeDetail !== false;

  const [days, setDays] = useState<ProgramProgressDay[]>([]);
  const [detail, setDetail] = useState<ActiveProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!programAssignmentId) {
      setDays([]);
      setDetail(null);
      setLoading(false);
      setError(null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const tasks: Promise<unknown>[] = [];
      if (includeDays) {
        tasks.push(
          fetchProgramProgressDays(programAssignmentId).then((d) => {
            setDays(d);
          })
        );
      } else {
        setDays([]);
      }
      if (includeDetail) {
        tasks.push(
          fetchActiveProgramDetail(programAssignmentId).then((d) => {
            setDetail(d);
          })
        );
      } else {
        setDetail(null);
      }
      await Promise.all(tasks);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load program");
      if (includeDays) setDays([]);
      if (includeDetail) setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [programAssignmentId, includeDays, includeDetail]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { days, detail, loading, error, refresh };
}

/** Convenience: only `anvil_get_active_program_detail` (My Program hero + plan summary). */
export function useActiveProgramDetail(programAssignmentId: string | null | undefined) {
  return useProgramProgress(programAssignmentId, {
    includeDays: false,
    includeDetail: true,
  });
}
