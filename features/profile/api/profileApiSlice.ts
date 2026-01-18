import { api } from "../../../shared/api/api";
import { supabase } from "../../../shared/supabase/client";
import type { ClientProfile, TrainerProfile, UserRow } from "../types/profile";
import type {
  UpdateMyUserRowInput,
  UpsertClientProfileInput,
} from "./profileApiTypes";

function normalizeTrainerProfile(row: any): TrainerProfile {
  // DB uses userId
  return {
    userId: row.userId,
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

export const profileApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getMyUserRow: build.query<UserRow, string>({
      async queryFn(userId) {
        const { data, error } = await supabase
          .from("users")
          .select(
            "id,email,role,roleConfirmed,firstName,lastName,avatarUrl,createdAt,updatedAt"
          )
          .eq("id", userId)
          .single();

        if (error) return { error: { message: error.message } };
        return { data: data as UserRow };
      },
      providesTags: (_res, _err, userId) => [{ type: "User", id: userId }],
    }),

    getClientProfile: build.query<ClientProfile | null, string>({
      async queryFn(userId) {
        const { data, error } = await supabase
          .from("clientProfiles")
          .select(
            "userId,phone,nationality,gender,birthDate,heightCm,weightKg,target,activityLevel,unitSystem,notes,createdAt,updatedAt"
          )
          .eq("userId", userId)
          .maybeSingle();

        if (error) return { error: { message: error.message } };
        return { data: (data as ClientProfile) ?? null };
      },
      providesTags: (_res, _err, userId) => [{ type: "Profile", id: userId }],
    }),

    getTrainerProfile: build.query<TrainerProfile | null, string>({
      async queryFn(userId) {
        const { data, error } = await supabase
          .from("trainerProfiles")
          .select(
            "userId,phone,brandName,primaryColor,secondaryColor,logoUrl,bio,certifications,instagram,website,createdAt,updatedAt"
          )
          .eq("userId", userId)
          .maybeSingle();

        if (error) return { error: { message: error.message } };
        if (!data) return { data: null };
        return { data: normalizeTrainerProfile(data) };
      },
      providesTags: (_res, _err, userId) => [{ type: "Profile", id: userId }],
    }),

    updateMyUserRow: build.mutation<
      null,
      { userId: string; payload: UpdateMyUserRowInput }
    >({
      async queryFn({ userId, payload }) {
        const { error } = await supabase
          .from("users")
          .update(payload)
          .eq("id", userId);
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: (_res, _err, { userId }) => [
        { type: "User", id: userId },
        { type: "Profile", id: userId },
      ],
    }),

    upsertClientProfile: build.mutation<
      null,
      { userId: string; payload: UpsertClientProfileInput }
    >({
      async queryFn({ userId, payload }) {
        const row: any = { ...payload, userId };
        const { error } = await supabase
          .from("clientProfiles")
          .upsert(row, { onConflict: "userId" });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: (_res, _err, { userId }) => [
        { type: "Profile", id: userId },
      ],
    }),

    upsertTrainerProfile: build.mutation<
      null,
      { userId: string; payload: Partial<TrainerProfile> }
    >({
      async queryFn({ userId, payload }) {
        // Write back to DB with userId
        const row: any = { ...payload, userId };
        delete row.user_id;
        const { error } = await supabase
          .from("trainerProfiles")
          .upsert(row, { onConflict: "userId" });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: (_res, _err, { userId }) => [
        { type: "Profile", id: userId },
      ],
    }),
  }),
});

export const {
  useGetMyUserRowQuery,
  useGetClientProfileQuery,
  useGetTrainerProfileQuery,
  useUpdateMyUserRowMutation,
  useUpsertClientProfileMutation,
  useUpsertTrainerProfileMutation,
} = profileApiSlice;
