import { useMemo } from "react";
import type { SetTypeRow } from "../types/setTypes";
import { guessSetTypeCategory, setTypeCategoryTitle } from "../utils/setTypeIcons";
import { useSetTypes } from "./useSetTypes";

export type SetTypesCategory = {
  key: "foundational" | "intensity" | "volume";
  title: string;
  rows: SetTypeRow[];
};

export function useSetTypesDictionary() {
  const { rows, isLoading, error, refetch } = useSetTypes();

  const categories = useMemo<SetTypesCategory[]>(() => {
    const map: Record<string, SetTypeRow[]> = {
      foundational: [],
      intensity: [],
      volume: [],
    };

    for (const r of rows) {
      const c = guessSetTypeCategory(r);
      map[c].push(r);
    }

    return (Object.keys(map) as ("foundational" | "intensity" | "volume")[]).map((k) => ({
      key: k,
      title: setTypeCategoryTitle[k],
      rows: map[k],
    }));
  }, [rows]);

  return { rows, categories, isLoading, error, refetch };
}
