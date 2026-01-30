/**
 * Matches Supabase `exercises` table schema.
 */
export type Exercise = {
  id: string;
  title: string;
  instructions: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  targetMuscles: string[];
  equipment: string[];
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
