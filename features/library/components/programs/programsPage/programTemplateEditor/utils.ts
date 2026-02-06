import type {
  ProgramPhase,
  ProgramWeek,
} from "@/features/library/types/programTemplate";

export function phaseHasData(phase: ProgramPhase): boolean {
  return phase.weeks.some((w) =>
    w.days.some((d) => (d.workouts?.length ?? 0) > 0 || d.workoutRef != null)
  );
}

export function weekHasData(week: ProgramWeek): boolean {
  return week.days.some(
    (d) => (d.workouts?.length ?? 0) > 0 || d.workoutRef != null
  );
}

/** Fingerprint for week content so identical weeks get the same color. */
export function weekContentFingerprint(week: ProgramWeek): string {
  return week.days
    .map((d) => {
      const refs = d.workouts ?? (d.workoutRef ? [d.workoutRef] : []);
      return refs
        .map((r) =>
          r?.source === "workoutsTable"
            ? `t:${r.workoutId}`
            : r?.source === "inline"
            ? `i:${r.inlineWorkoutId}`
            : ""
        )
        .join(",");
    })
    .join("|");
}
