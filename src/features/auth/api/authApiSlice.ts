import * as Linking from "expo-linking";
import { api } from "../../../shared/api/api";
import { supabase } from "../../../shared/supabase/client";
import type { UserRole } from "../types/auth";

function getRedirectUrl(path: string) {
  // Configure allowed redirects in Supabase Auth settings:
  // e.g. anvil://, exp://, and your production scheme
  return Linking.createURL(path);
}

export const authApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    signInWithPassword: build.mutation<null, { email: string; password: string }>({
      async queryFn({ email, password }) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Auth"],
    }),

    signInWithMagicLink: build.mutation<null, { email: string }>({
      async queryFn({ email }) {
        const emailRedirectTo = getRedirectUrl("/"); // role gate
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo },
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Auth"],
    }),

    signUpWithPassword: build.mutation<null, { email: string; password: string }>({
      async queryFn({ email, password }) {
        const emailRedirectTo = getRedirectUrl("/"); // after confirm / magic
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo },
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Auth"],
    }),

    sendPasswordReset: build.mutation<null, { email: string }>({
      async queryFn({ email }) {
        const redirectTo = getRedirectUrl("/(auth)/reset-password");
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Auth"],
    }),

    updatePassword: build.mutation<null, { newPassword: string }>({
      async queryFn({ newPassword }) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Auth"],
    }),

    signOut: build.mutation<null, void>({
      async queryFn() {
        const { error } = await supabase.auth.signOut();
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Auth"],
    }),

    getUserRole: build.query<UserRole, string>({
      async queryFn(userId) {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();

        if (error) return { error: { message: error.message } };

        const role = data?.role as UserRole | undefined;
        if (!role || (role !== "trainer" && role !== "client")) {
          return { error: { message: "Invalid or missing user role." } };
        }

        return { data: role };
      },
      providesTags: (_res, _err, userId) => [{ type: "User", id: userId }],
    }),
  }),
});

export const {
  useSignInWithPasswordMutation,
  useSignInWithMagicLinkMutation,
  useSignUpWithPasswordMutation,
  useSendPasswordResetMutation,
  useUpdatePasswordMutation,
  useSignOutMutation,
  useLazyGetUserRoleQuery,
} = authApiSlice;

