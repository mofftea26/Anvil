import { supabase } from "@/src/shared/supabase/client";
import type { WorkoutDraftState } from "../types/workoutDraftState";

export type WorkoutDraftRow = {
  id: string;
  trainerId: string;
  state: WorkoutDraftState;
  createdAt: string;
  updatedAt: string;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function fetchWorkoutDraftById(
  draftId: string
): Promise<WorkoutDraftRow | null> {
  const { data, error } = await supabase
    .from("workoutDrafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();

  if (error) throw error;
  return (data as WorkoutDraftRow | null) ?? null;
}

export async function createWorkoutDraft(
  state: WorkoutDraftState
): Promise<WorkoutDraftRow> {
  const trainerId = await requireUserId();

  const { data, error } = await supabase
    .from("workoutDrafts")
    .insert({
      trainerId,
      state,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as WorkoutDraftRow;
}

export async function updateWorkoutDraft(
  draftId: string,
  state: WorkoutDraftState
): Promise<WorkoutDraftRow> {
  const { data, error } = await supabase
    .from("workoutDrafts")
    .update({ state })
    .eq("id", draftId)
    .select("*")
    .single();

  if (error) throw error;
  return data as WorkoutDraftRow;
}

export async function deleteWorkoutDraft(draftId: string): Promise<void> {
  const { error } = await supabase.from("workoutDrafts").delete().eq("id", draftId);
  if (error) throw error;
}
