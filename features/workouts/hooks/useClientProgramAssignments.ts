import { useCallback, useEffect, useMemo, useState } from "react";

import { appToast } from "@/shared/ui";

import type { ClientProgramAssignment } from "../types";
import { listClientProgramAssignments } from "../api/clientWorkouts.api";

export function useClientProgramAssignments(params: { clientId: string }) {
  const [items, setItems] = useState<ClientProgramAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!params.clientId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listClientProgramAssignments({ clientId: params.clientId });
      setItems(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [params.clientId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refreshing]);

  const showErrorToast = useCallback(() => {
    if (error) appToast.error(error);
  }, [error]);

  const active = useMemo(() => items.filter((x) => String(x.status ?? "") !== "archived"), [items]);
  const archived = useMemo(() => items.filter((x) => String(x.status ?? "") === "archived"), [items]);

  return {
    items,
    active,
    archived,
    loading,
    refreshing,
    error,
    showErrorToast,
    refetch,
    onRefresh,
  };
}

