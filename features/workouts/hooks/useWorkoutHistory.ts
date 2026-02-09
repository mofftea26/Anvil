import { useCallback, useEffect, useMemo, useState } from "react";

import { appToast } from "@/shared/ui";

import { listWorkoutSessions } from "../api/clientWorkouts.api";
import type { WorkoutSession } from "../types";

export type HistoryRangeKey = "7d" | "30d" | "all";

function startIsoForRange(range: HistoryRangeKey): string | undefined {
  if (range === "all") return undefined;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (range === "7d" ? 7 : 30));
  return d.toISOString();
}

export function useWorkoutHistory(params: { clientId: string }) {
  const [range, setRange] = useState<HistoryRangeKey>("30d");
  const [rows, setRows] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startIso = useMemo(() => startIsoForRange(range), [range]);

  const fetchRows = useCallback(async () => {
    setError(null);
    try {
      const data = await listWorkoutSessions({
        clientId: params.clientId,
        startIso,
        limit: 200,
      });
      setRows(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    }
  }, [params.clientId, startIso]);

  useEffect(() => {
    setIsLoading(true);
    fetchRows().finally(() => setIsLoading(false));
  }, [fetchRows]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  }, [fetchRows]);

  const showErrorToast = useCallback(() => {
    if (error) appToast.error(error);
  }, [error]);

  return { rows, range, setRange, isLoading, refreshing, onRefresh, error, showErrorToast };
}

