import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useMemo } from "react";

import type { ProgramWeek } from "@/features/library/types/programTemplate";
import { useTheme } from "@/shared/ui";
import { weekContentFingerprint } from "../utils";

export function useWeekPillColors(weeks: ProgramWeek[] | undefined) {
  const theme = useTheme();

  return useMemo(() => {
    const list = weeks ?? [];
    if (list.length === 0) return [] as string[];
    const fingerprints = list.map((w) => weekContentFingerprint(w));
    const seen = new Map<string, number>();
    const groupIds = fingerprints.map((f) => {
      if (!seen.has(f)) seen.set(f, seen.size);
      return seen.get(f)!;
    });
    const palette = [
      "transparent",
      hexToRgba(theme.colors.accent, 0.14),
      hexToRgba(theme.colors.accent, 0.22),
      hexToRgba(theme.colors.textMuted, 0.12),
      hexToRgba(theme.colors.textMuted, 0.2),
    ];
    return groupIds.map((gid) => palette[(gid % (palette.length - 1)) + 1]);
  }, [weeks, theme.colors.accent, theme.colors.textMuted]);
}
