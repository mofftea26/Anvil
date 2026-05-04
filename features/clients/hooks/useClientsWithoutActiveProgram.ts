import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  fetchClientsWithoutActiveProgram,
  type ClientWithoutActiveProgram,
} from "@/features/clients/api/clientsWithoutProgram.api";

export function useClientsWithoutActiveProgram() {
  const [rows, setRows] = useState<ClientWithoutActiveProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchClientsWithoutActiveProgram();
      setRows(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { rows, loading, refreshing, error, onRefresh, reload: load };
}
