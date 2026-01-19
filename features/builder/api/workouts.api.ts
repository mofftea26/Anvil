import { supabase } from "@/src/shared/supabase/client";
import type { WorkoutDraftState } from "../types/workoutDraftState";

export type WorkoutRow = {
  id: string;
  trainerId: string;
  title: string;
  state: WorkoutDraftState;
  createdAt: string;
  updatedAt: string;
};

export async function publishWorkoutDraft(
  draftId: string,
  title?: string | null
): Promise<{ workoutId: string }> {
  const { data, error } = await supabase.rpc("publish_workout_draft", {
    draft_id: draftId,
    workout_title: title ?? null,
  });

  if (error) throw error;
  return { workoutId: data as string };
}

export async function fetchWorkoutById(workoutId: string): Promise<WorkoutRow | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .maybeSingle();

  if (error) throw error;
  return (data as WorkoutRow | null) ?? null;
}
