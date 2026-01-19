import { supabase } from "@/shared/supabase/client";
import type { WorkoutState } from "../types/workoutState";

export type WorkoutRow = {
  id: string;
  trainerId: string;
  title: string;
  state: WorkoutState;
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

export async function fetchWorkoutById(workoutId: string): Promise<WorkoutRow | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", workoutId)
    .maybeSingle();

  if (error) throw error;
  return (data as WorkoutRow | null) ?? null;
}

export async function fetchWorkoutsByTrainer(trainerId: string): Promise<WorkoutRow[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("trainerId", trainerId)
    .order("updatedAt", { ascending: false });

  if (error) throw error;
  return (data as WorkoutRow[]) ?? [];
}

export async function createWorkout(params: {
  title: string;
  state: WorkoutState;
}): Promise<WorkoutRow> {
  const trainerId = await requireUserId();

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      trainerId,
      title: params.title,
      state: params.state,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as WorkoutRow;
}

export async function updateWorkout(params: {
  workoutId: string;
  title?: string;
  state: WorkoutState;
}): Promise<WorkoutRow> {
  const patch: any = { state: params.state };
  if (typeof params.title === "string") patch.title = params.title;

  const { data, error } = await supabase
    .from("workouts")
    .update(patch)
    .eq("id", params.workoutId)
    .select("*")
    .single();

  if (error) throw error;
  return data as WorkoutRow;
}
