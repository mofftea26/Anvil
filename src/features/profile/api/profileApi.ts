import { supabase } from "../../../shared/supabase/client";
import type { ClientProfile, TrainerProfile, UserRow } from "../types/profile";

type UpsertClientProfileInput = {
  userId: string;
  phone?: string | null;
  nationality?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  target?: string | null;
  activityLevel?: string | null;
  unitSystem?: string | null;
  notes?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function normalizeTrainerProfile(row: any): TrainerProfile {
  // DB uses user_id; frontend uses userId
  return {
    userId: row.user_id ?? row.userId,
    phone: row.phone ?? null,
    brandName: row.brandName ?? null,
    primaryColor: row.primaryColor ?? null,
    secondaryColor: row.secondaryColor ?? null,
    logoUrl: row.logoUrl ?? null,
    bio: row.bio ?? null,
    certifications: row.certifications ?? null,
    instagram: row.instagram ?? null,
    website: row.website ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getMyUserRow(userId: string): Promise<UserRow> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id,email,role,roleConfirmed,firstName,lastName,avatarUrl,createdAt,updatedAt"
    )
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data as UserRow;
}

export async function updateMyUserRow(
  userId: string,
  payload: UpsertClientProfileInput
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function getClientProfile(
  userId: string
): Promise<ClientProfile | null> {
  const { data, error } = await supabase
    .from("clientProfiles")
    .select(
      "userId,phone,nationality,gender,birthDate,heightCm,weightKg,target,activityLevel,unitSystem,notes,createdAt,updatedAt"
    )
    .eq("userId", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as ClientProfile) ?? null;
}

export async function upsertClientProfile(
  userId: string,
  input: UpsertClientProfileInput
): Promise<void> {
  const payload: UpsertClientProfileInput = {
    ...input,
    userId,
  };

  const { error } = await supabase
    .from("clientProfiles")
    .upsert(payload, { onConflict: "userId" });

  if (error) throw new Error(error.message);
}

export async function getTrainerProfile(
  userId: string
): Promise<TrainerProfile | null> {
  const { data, error } = await supabase
    .from("trainerProfiles")
    .select(
      "userId,phone,brandName,primaryColor,secondaryColor,logoUrl,bio,certifications,instagram,website,createdAt,updatedAt"
    )
    .eq("userId", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return normalizeTrainerProfile(data);
}

export async function upsertTrainerProfile(
  userId: string,
  payload: Partial<TrainerProfile>
): Promise<void> {
  // Write back to DB with user_id
  const row: any = {
    ...payload,
    user_id: userId,
  };
  delete row.userId;

  const { error } = await supabase
    .from("trainerProfiles")
    .upsert(row, { onConflict: "userId" });

  if (error) throw new Error(error.message);
}
