import type { ProgramTemplateState } from "@/features/library/types/programTemplate";
import type { ClientProgramAssignmentProgressV1 } from "../types";

export function totalPlannedDayKeys(state: ProgramTemplateState | null | undefined): string[] {
  const out: string[] = [];
  for (const phase of state?.phases ?? []) {
    for (const week of phase.weeks ?? []) {
      for (const day of week.days ?? []) {
        if (day?.id) out.push(day.id);
      }
    }
  }
  return out;
}

export function normalizeCompletedDayKeys(progress: ClientProgramAssignmentProgressV1 | null | undefined): string[] {
  const keys = progress?.completedDayKeys ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of keys) {
    if (!k || typeof k !== "string") continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

export function computeProgressPercent(params: {
  totalPlannedDays: number;
  completedDays: number;
}): number {
  const total = Math.max(0, params.totalPlannedDays);
  if (total === 0) return 0;
  const completed = Math.min(total, Math.max(0, params.completedDays));
  return Math.floor((completed / total) * 100);
}

