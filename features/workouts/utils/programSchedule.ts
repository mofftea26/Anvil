import type { DayWorkoutRef, ProgramDay, ProgramTemplateState } from "@/features/library/types/programTemplate";

export type FlattenedProgramDay = {
  offset: number; // days since start
  weekIndex1: number;
  dayIndex1: number;
  dayKey: string;
  day: ProgramDay;
  workoutRefs: DayWorkoutRef[];
};

function refsForDay(day: ProgramDay): DayWorkoutRef[] {
  if (Array.isArray(day.workouts) && day.workouts.length) return day.workouts;
  return day.workoutRef ? [day.workoutRef] : [];
}

export function flattenProgramDays(state: ProgramTemplateState): FlattenedProgramDay[] {
  const out: FlattenedProgramDay[] = [];
  let offset = 0;
  for (const phase of state.phases ?? []) {
    for (const week of phase.weeks ?? []) {
      for (const day of week.days ?? []) {
        const weekIndex1 = Math.floor(offset / 7) + 1;
        const dayIndex1 = (offset % 7) + 1;
        out.push({
          offset,
          weekIndex1,
          dayIndex1,
          dayKey: String(day.id ?? ""),
          day,
          workoutRefs: refsForDay(day),
        });
        offset += 1;
      }
    }
  }
  return out;
}

export function firstWorkoutTemplateId(day: FlattenedProgramDay): string | null {
  for (const r of day.workoutRefs ?? []) {
    if (r && r.source === "workoutsTable" && typeof (r as any).workoutId === "string") {
      return (r as any).workoutId as string;
    }
  }
  return null;
}

