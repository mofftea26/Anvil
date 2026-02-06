import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import type {
  DayWorkoutRef,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";

export function refToWorkoutRow(
  ref: DayWorkoutRef,
  workoutRowsMap: Record<string, WorkoutRow>,
  inlineWorkouts: ProgramTemplateState["workoutLibrary"]["inlineWorkouts"]
): WorkoutRow | null {
  if (!ref) return null;
  if (ref.source === "workoutsTable") {
    return workoutRowsMap[ref.workoutId] ?? null;
  }
  const inline = inlineWorkouts?.find((w) => w.id === ref.inlineWorkoutId);
  if (!inline) return null;
  return {
    id: inline.id,
    trainerId: "",
    title: inline.title,
    state: inline.state as WorkoutRow["state"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
