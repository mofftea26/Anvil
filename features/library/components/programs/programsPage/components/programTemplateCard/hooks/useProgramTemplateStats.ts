import type {
  ProgramDifficulty,
  ProgramTemplate,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { useMemo } from "react";

export function useProgramTemplateStats(template: ProgramTemplate) {
  return useMemo(() => {
    const state: ProgramTemplateState | null = template.state ?? null;
    const difficulty: ProgramDifficulty =
      state?.difficulty ?? template.difficulty;
    const totalWeeks = state?.durationWeeks ?? template.durationWeeks ?? 0;
    const phaseCount = state?.phases?.length ?? 0;
    return { difficulty, totalWeeks, phaseCount };
  }, [template.state, template.difficulty, template.durationWeeks]);
}
