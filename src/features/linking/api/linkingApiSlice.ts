import { api } from "../../../shared/api/api";
import { supabase } from "../../../shared/supabase/client";

export const linkingApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    redeemInviteCode: build.mutation<null, { code: string }>({
      async queryFn({ code }) {
        const { error } = await supabase.rpc("anvilRedeemInviteCode", { code });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
    }),

    createTrainerRequest: build.mutation<
      null,
      { trainerEmail: string; message: string }
    >({
      async queryFn({ trainerEmail, message }) {
        const { error } = await supabase.rpc("anvilCreateTrainerRequest", {
          trainerEmail,
          message,
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
    }),

    createTrainerInvite: build.mutation<any, { targetEmail?: string }>({
      async queryFn({ targetEmail }) {
        const { data, error } = await supabase.rpc("anvilCreateTrainerInvite", {
          targetEmail: targetEmail ?? null,
        });
        if (error) return { error: { message: error.message } };
        return { data };
      },
    }),

    createClientByEmail: build.mutation<
      any,
      {
        clientEmail: string;
        firstName?: string;
        lastName?: string;
        sendMagicLink?: boolean;
      }
    >({
      async queryFn(payload) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) return { error: { message: "Not authenticated" } };

        const { data, error } = await supabase.functions.invoke(
          "anvil-create-client",
          {
            body: payload,
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (error) return { error: { message: error.message } };
        return { data };
      },
    }),
  }),
});

export const {
  useRedeemInviteCodeMutation,
  useCreateTrainerRequestMutation,
  useCreateTrainerInviteMutation,
  useCreateClientByEmailMutation,
} = linkingApiSlice;
