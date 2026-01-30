import { supabase } from "@/shared/supabase/client";
import type { Exercise } from "@/shared/types/exercise";

export type FetchExercisesParams = {
  search?: string;
  isArchived?: boolean;
  /** Filter by target muscles (exercise must have at least one of these). */
  targetMuscles?: string[];
};

export async function fetchExercises(
  params: FetchExercisesParams = {}
): Promise<Exercise[]> {
  let q = supabase
    .from("exercises")
    .select(
      "id,title,instructions,imageUrl,videoUrl,targetMuscles,equipment,isStock,ownerTrainerId,createdByTrainerId,createdAt,lastEditedByTrainerId,lastEditedAt,updatedAt,sourceTemplateId,isArchived"
    )
    .order("title", { ascending: true });

  if (params.isArchived === false) {
    q = q.eq("isArchived", false);
  } else if (params.isArchived === true) {
    q = q.eq("isArchived", true);
  }

  const search = params.search?.trim();
  if (search && search.length > 0) {
    q = q.ilike("title", `%${search}%`);
  }

  const muscles = params.targetMuscles?.filter((m) => m?.trim());
  if (muscles && muscles.length > 0) {
    q = q.overlaps("targetMuscles", muscles);
  }

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as RawExerciseRow[];
  return rows.map(normalizeExerciseRow);
}

export async function fetchExerciseById(exerciseId: string): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select(
      "id,title,instructions,imageUrl,videoUrl,targetMuscles,equipment,isStock,ownerTrainerId,createdByTrainerId,createdAt,lastEditedByTrainerId,lastEditedAt,updatedAt,sourceTemplateId,isArchived"
    )
    .eq("id", exerciseId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return normalizeExerciseRow(data as RawExerciseRow);
}

type RawExerciseRow = {
  id: string;
  title: string;
  instructions: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  targetMuscles: string[] | null;
  equipment: string[] | null;
  isStock: boolean;
  ownerTrainerId: string | null;
  createdByTrainerId: string | null;
  createdAt: string;
  lastEditedByTrainerId: string | null;
  lastEditedAt: string | null;
  updatedAt: string;
  sourceTemplateId: string | null;
  isArchived: boolean;
};

function normalizeExerciseRow(row: RawExerciseRow): Exercise {
  return {
    id: row.id,
    title: row.title,
    instructions: row.instructions ?? null,
    imageUrl: row.imageUrl ?? null,
    videoUrl: row.videoUrl ?? null,
    targetMuscles: Array.isArray(row.targetMuscles) ? row.targetMuscles : [],
    equipment: Array.isArray(row.equipment) ? row.equipment : [],
    isStock: Boolean(row.isStock),
    ownerTrainerId: row.ownerTrainerId ?? null,
    createdByTrainerId: row.createdByTrainerId ?? null,
    createdAt: row.createdAt,
    lastEditedByTrainerId: row.lastEditedByTrainerId ?? null,
    lastEditedAt: row.lastEditedAt ?? null,
    updatedAt: row.updatedAt,
    sourceTemplateId: row.sourceTemplateId ?? null,
    isArchived: Boolean(row.isArchived),
  };
}
