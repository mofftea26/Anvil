export type PendingExercisePick = {
    token: string;
    targetSeriesId: string;
    exerciseIds: string[];
  };
  
  let pending: PendingExercisePick | null = null;
  
  export function setPendingExercisePick(value: PendingExercisePick) {
    pending = value;
  }
  
  export function consumePendingExercisePick(): PendingExercisePick | null {
    const value = pending;
    pending = null;
    return value;
  }
  