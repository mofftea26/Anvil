export type PendingExercisePick = {
  token: string;
  targetSeriesId: string;
  exerciseIds: string[];
  /** When set, used to build series exercises (id, title, videoUrl). Otherwise caller may resolve from ids. */
  exercises?: { id: string; title: string; videoUrl: string | null }[];
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
  