/**
 * When creating a new workout from the program template Day Planner,
 * we set this so that after save we can attach the new workout to the day.
 * Uses new state: phaseIndex, weekIndex, dayOrder (0-based).
 */
export type PendingProgramDayAttachment = {
  programId: string;
  phaseIndex: number;
  weekIndex: number;
  dayOrder: number;
};

let pending: PendingProgramDayAttachment | null = null;

export function setPendingProgramDayAttachment(value: PendingProgramDayAttachment | null) {
  pending = value;
}

export function consumePendingProgramDayAttachment(): PendingProgramDayAttachment | null {
  const p = pending;
  pending = null;
  return p;
}
