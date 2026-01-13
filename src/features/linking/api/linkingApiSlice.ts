import { api } from "../../../shared/api/api";
import { supabase } from "../../../shared/supabase/client";
import type {
  ClientProfile,
  TrainerProfile,
  UserRow,
} from "../../profile/types/profile";
import type {
  TrainerClientLink,
  TrainerInvite,
  TrainerRequest,
} from "../types/linking";

type TrainerClientWithDetails = TrainerClientLink & {
  client:
    | (Pick<
        UserRow,
        "id" | "email" | "firstName" | "lastName" | "avatarUrl"
      > & {
        profile?: Pick<
          ClientProfile,
          "target" | "heightCm" | "weightKg"
        > | null;
      })
    | null;
};

type CoachDetails = {
  link: TrainerClientLink;
  trainer: Pick<
    UserRow,
    "id" | "email" | "firstName" | "lastName" | "avatarUrl"
  > | null;
  trainerProfile: TrainerProfile | null;
};

export const linkingApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    // ---------- Trainer: clients ----------
    getTrainerClients: build.query<
      TrainerClientWithDetails[],
      { trainerId: string }
    >({
      async queryFn({ trainerId }) {
        const { data: links, error } = await supabase
          .from("trainerClients")
          .select("id,trainerId,clientId,status,createdAt")
          .eq("trainerId", trainerId)
          .order("createdAt", { ascending: false });

        if (error) return { error: { message: error.message } };
        const rows = (links as any[]) ?? [];
        const clientIds = rows.map((r) => r.clientId).filter(Boolean);

        const [usersRes, profilesRes] = await Promise.all([
          supabase
            .from("users")
            .select("id,email,firstName,lastName,avatarUrl")
            .in(
              "id",
              clientIds.length
                ? clientIds
                : ["00000000-0000-0000-0000-000000000000"]
            ),
          supabase
            .from("clientProfiles")
            .select("userId,target,heightCm,weightKg")
            .in(
              "userId",
              clientIds.length
                ? clientIds
                : ["00000000-0000-0000-0000-000000000000"]
            ),
        ]);

        if (usersRes.error)
          return { error: { message: usersRes.error.message } };
        if (profilesRes.error)
          return { error: { message: profilesRes.error.message } };

        const usersById = new Map<string, any>(
          ((usersRes.data as any[]) ?? []).map((u) => [u.id, u])
        );
        const profilesById = new Map<string, any>(
          ((profilesRes.data as any[]) ?? []).map((p) => [p.userId, p])
        );

        const data: TrainerClientWithDetails[] = rows.map((r) => {
          const u = usersById.get(r.clientId) ?? null;
          const p = profilesById.get(r.clientId) ?? null;
          return {
            ...r,
            client: u
              ? {
                  ...u,
                  profile: p
                    ? {
                        target: p.target ?? null,
                        heightCm: p.heightCm ?? null,
                        weightKg: p.weightKg ?? null,
                      }
                    : null,
                }
              : null,
          } as TrainerClientWithDetails;
        });

        return { data };
      },
      providesTags: (_res, _err, arg) => [
        { type: "TrainerClients", id: arg.trainerId },
      ],
    }),

    setTrainerClientStatus: build.mutation<
      TrainerClientLink,
      { clientId: string; status: "active" | "archived" }
    >({
      async queryFn({ clientId, status }) {
        const { data, error } = await supabase.rpc(
          "anvil_set_trainer_client_status",
          {
            p_client_id: clientId,
            p_status: status,
          }
        );
        if (error) return { error: { message: error.message } };
        return { data: data as TrainerClientLink };
      },
      invalidatesTags: ["TrainerClients", "Coach"],
    }),

    // ---------- Trainer: invites ----------
    createTrainerInvite: build.mutation<
      TrainerInvite,
      { targetEmail?: string | null; expiresAt?: string | null }
    >({
      async queryFn({ targetEmail, expiresAt }) {
        const { data, error } = await supabase.rpc(
          "anvil_create_trainer_invite",
          {
            p_target_email: targetEmail ?? null,
            p_expires_at: expiresAt ?? null,
          }
        );
        if (error) return { error: { message: error.message } };

        return { data: data as TrainerInvite };
      },
      invalidatesTags: ["TrainerInvites"],
    }),

    getTrainerInvites: build.query<TrainerInvite[], { trainerId: string }>({
      async queryFn({ trainerId }) {
        const { data, error } = await supabase
          .from("trainerInvites")
          .select(
            "id,trainerId,code,targetEmail,status,expiresAt,redeemedBy,redeemedAt,createdAt"
          )
          .eq("trainerId", trainerId)
          .order("createdAt", { ascending: false });
        if (error) return { error: { message: error.message } };
        return { data: (data as TrainerInvite[]) ?? [] };
      },
      providesTags: (_res, _err, arg) => [
        { type: "TrainerInvites", id: arg.trainerId },
      ],
    }),

    // ---------- Client: redeem invite ----------
    redeemInviteCode: build.mutation<TrainerClientLink, { code: string }>({
      async queryFn({ code }) {
        const { data, error } = await supabase.rpc("anvil_redeem_invite_code", {
          p_code: code,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as TrainerClientLink };
      },
      invalidatesTags: ["Coach"],
    }),

    // ---------- Client: requests ----------
    createTrainerRequest: build.mutation<
      TrainerRequest,
      { trainerEmail: string; message?: string | null }
    >({
      async queryFn({ trainerEmail, message }) {
        const { data, error } = await supabase.rpc(
          "anvil_create_trainer_request",
          {
            p_trainer_email: trainerEmail,
            p_message: message ?? null,
          }
        );
        if (error) return { error: { message: error.message } };
        return { data: data as TrainerRequest };
      },
      invalidatesTags: ["TrainerRequests"],
    }),

    getClientRequests: build.query<TrainerRequest[], { clientId: string }>({
      async queryFn({ clientId }) {
        const { data, error } = await supabase
          .from("trainerRequests")
          .select(
            "id,clientId,trainerEmail,message,status,createdAt,resolvedAt"
          )
          .eq("clientId", clientId)
          .order("createdAt", { ascending: false });
        if (error) return { error: { message: error.message } };
        return { data: (data as TrainerRequest[]) ?? [] };
      },
      providesTags: (_res, _err, arg) => [
        { type: "TrainerRequests", id: arg.clientId },
      ],
    }),

    cancelTrainerRequest: build.mutation<TrainerRequest, { requestId: string }>(
      {
        async queryFn({ requestId }) {
          const { data, error } = await supabase.rpc(
            "anvil_cancel_trainer_request",
            {
              p_request_id: requestId,
            }
          );
          if (error) return { error: { message: error.message } };
          return { data: data as TrainerRequest };
        },
        invalidatesTags: ["TrainerRequests"],
      }
    ),

    // ---------- Trainer: requests inbox ----------
    getTrainerRequestsInbox: build.query<
      TrainerRequest[],
      { trainerEmail: string }
    >({
      async queryFn({ trainerEmail }) {
        const { data, error } = await supabase
          .from("trainerRequests")
          .select(
            "id,clientId,trainerEmail,message,status,createdAt,resolvedAt"
          )
          .eq("trainerEmail", trainerEmail)
          .order("createdAt", { ascending: false });
        if (error) return { error: { message: error.message } };
        return { data: (data as TrainerRequest[]) ?? [] };
      },
      providesTags: (_res, _err, arg) => [
        { type: "TrainerRequests", id: arg.trainerEmail },
      ],
    }),

    acceptTrainerRequest: build.mutation<
      TrainerClientLink,
      { requestId: string }
    >({
      async queryFn({ requestId }) {
        const { data, error } = await supabase.rpc(
          "anvil_accept_trainer_request",
          {
            p_request_id: requestId,
          }
        );
        if (error) return { error: { message: error.message } };
        return { data: data as TrainerClientLink };
      },
      invalidatesTags: ["TrainerRequests", "TrainerClients", "Coach"],
    }),

    declineTrainerRequest: build.mutation<
      TrainerRequest,
      { requestId: string }
    >({
      async queryFn({ requestId }) {
        const { data, error } = await supabase.rpc(
          "anvil_decline_trainer_request",
          {
            p_request_id: requestId,
          }
        );
        if (error) return { error: { message: error.message } };
        return { data: data as TrainerRequest };
      },
      invalidatesTags: ["TrainerRequests"],
    }),

    // ---------- Client: my coach ----------
    getMyCoach: build.query<CoachDetails | null, { clientId: string }>({
      async queryFn({ clientId }) {
        const { data: link, error } = await supabase
          .from("trainerClients")
          .select("id,trainerId,clientId,status,createdAt")
          .eq("clientId", clientId)
          .eq("status", "active")
          .maybeSingle();

        if (error) return { error: { message: error.message } };
        if (!link) return { data: null };

        const trainerId = (link as any).trainerId as string;

        const [userRes, profileRes] = await Promise.all([
          supabase
            .from("users")
            .select("id,email,firstName,lastName,avatarUrl")
            .eq("id", trainerId)
            .maybeSingle(),
          supabase
            .from("trainerProfiles")
            .select(
              "userId,phone,brandName,primaryColor,secondaryColor,logoUrl,bio,certifications,instagram,website,createdAt,updatedAt"
            )
            .eq("userId", trainerId)
            .maybeSingle(),
        ]);

        if (userRes.error) return { error: { message: userRes.error.message } };
        if (profileRes.error)
          return { error: { message: profileRes.error.message } };

        return {
          data: {
            link: link as any,
            trainer: (userRes.data as any) ?? null,
            trainerProfile: (profileRes.data as any) ?? null,
          },
        };
      },
      providesTags: (_res, _err, arg) => [{ type: "Coach", id: arg.clientId }],
    }),

    // ---------- Trainer: create client by email (edge function) ----------
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
        try {
          const sessionRes = await supabase.auth.getSession();
          const accessToken = sessionRes.data?.session?.access_token ?? null;
          if (!accessToken) return { error: { message: "Not authenticated" } };

          const { data, error } = await supabase.functions.invoke(
            "anvil-create-client",
            {
              body: payload,
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (error) return { error: { message: error.message } };
          return { data: data ?? null };
        } catch (e: any) {
          return {
            error: {
              message: e?.message ?? "Something went wrong. Please try again.",
            },
          };
        }
      },
      invalidatesTags: ["TrainerClients"],
    }),
  }),
});

export const {
  useGetTrainerClientsQuery,
  useSetTrainerClientStatusMutation,
  useCreateTrainerInviteMutation,
  useGetTrainerInvitesQuery,
  useRedeemInviteCodeMutation,
  useCreateTrainerRequestMutation,
  useGetClientRequestsQuery,
  useCancelTrainerRequestMutation,
  useGetTrainerRequestsInboxQuery,
  useAcceptTrainerRequestMutation,
  useDeclineTrainerRequestMutation,
  useGetMyCoachQuery,
  useCreateClientByEmailMutation,
} = linkingApiSlice;
