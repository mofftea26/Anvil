import { supabase } from "@/shared/supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import type { SetTypeRow } from "../types/setTypes";

const CACHE_KEY = "anvil:setTypesCache:v1";

type UseSetTypesResult = {
  rows: SetTypeRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useSetTypes(): UseSetTypesResult {
  const [rows, setRows] = useState<SetTypeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCache() {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SetTypeRow[];
      if (Array.isArray(parsed)) setRows(parsed);
    } catch {
      // ignore cache errors
    }
  }

  async function saveCache(next: SetTypeRow[]) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("setTypes")
      .select("id,key,title,description")
      .order("title", { ascending: true });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    const normalized = (data ?? []) as SetTypeRow[];
    setRows(normalized);
    await saveCache(normalized);
    setIsLoading(false);
  };

  useEffect(() => {
    // instant paint from cache, then refresh
    loadCache().finally(() => {
      refetch();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(
    () => ({
      rows,
      isLoading,
      error,
      refetch,
    }),
    [rows, isLoading, error]
  );
}
