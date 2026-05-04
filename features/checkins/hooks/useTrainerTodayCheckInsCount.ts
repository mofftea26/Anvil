import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { toYmd } from "@/features/workouts/utils/dateUtils";

import { fetchTrainerCheckinsByDate } from "../api/checkins.api";

/**
 * Lightweight count for trainer dashboard card — today’s `clientCheckIns` rows.
 */
export function useTrainerTodayCheckInsCount(refreshToken: number) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const ymd = toYmd(new Date());
    try {
      const rows = await fetchTrainerCheckinsByDate(ymd);
      setCount(rows.length);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    void load();
  }, [refreshToken, load]);

  return { count, loading, refetch: load };
}
