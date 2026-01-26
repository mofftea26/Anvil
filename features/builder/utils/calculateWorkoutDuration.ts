import type { SeriesExercise, Tempo, WorkoutSeries } from "../types";

/**
 * Calculate duration for a single rep based on tempo
 */
function calculateRepDuration(tempo: Tempo): number {
  const eccentric = Number(tempo.eccentric) || 0;
  const bottom = Number(tempo.bottom) || 0;
  const concentric = Number(tempo.concentric) || 0;
  const top = Number(tempo.top) || 0;
  return eccentric + bottom + concentric + top;
}

/**
 * Calculate duration for a single exercise
 */
function calculateExerciseDuration(exercise: SeriesExercise): number {
  if (!exercise.sets || exercise.sets.length === 0) {
    return 0;
  }

  const repDuration = calculateRepDuration(exercise.tempo);
  let totalSeconds = 0;

  exercise.sets.forEach((set, index) => {
    const reps = Number(set.reps) || 0;
    const restSec = Number(set.restSec) || 0;

    totalSeconds += reps * repDuration;

    if (index < exercise.sets.length - 1) {
      totalSeconds += restSec;
    }
  });

  return totalSeconds;
}

/**
 * Calculate total workout duration in minutes from all series
 */
export function calculateWorkoutDuration(series: WorkoutSeries[]): number | null {
  if (!series || series.length === 0) {
    return null;
  }

  let totalSeconds = 0;

  series.forEach((s) => {
    s.exercises.forEach((exercise) => {
      totalSeconds += calculateExerciseDuration(exercise);
    });
  });

  const totalMinutes = Math.ceil(totalSeconds / 60);
  return totalMinutes > 0 ? totalMinutes : null;
}
