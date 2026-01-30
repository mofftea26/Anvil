/**
 * When creating a new workout from the program template Day Planner,
 * we set this so that after save we can attach the new workout to the day.
 */
export type PendingProgramDayAttachment = {
  programId: string;
  weekIndex: number;
  dayIndex: number;
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
