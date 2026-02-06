export type DraggingWorkoutState = {
  fromDayOrder: number;
  workoutIndex: number;
  workoutTitle: string;
};

export type DragFocusSection = 0 | 1 | 2; // 0 workouts, 1 phases, 2 weeks
