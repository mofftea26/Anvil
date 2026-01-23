import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  useAcceptTrainerRequestMutation,
  useCreateClientByEmailMutation,
  useCreateTrainerInviteMutation,
  useDeclineTrainerRequestMutation,
  useGetTrainerRequestsInboxQuery,
} from "@/features/linking/api/linkingApiSlice";
import { mapLinkingError } from "@/features/linking/utils/linkingErrors";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";

export type TrainerAddClientTab = "invite" | "requests" | "create";

export function useTrainerAddClient() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);
  const { me } = useMyProfile();

  const [tab, setTab] = useState<TrainerAddClientTab>("invite");

  const trainerId = auth.userId ?? "";
  const trainerEmail = me?.email ?? "";

  const [createInvite, createInviteState] = useCreateTrainerInviteMutation();
  const [generatedCode, setGeneratedCode] = useState("");
  const didAutoGenerate = useRef(false);

  const {
    data: inbox,
    isLoading: inboxLoading,
    refetch: refetchInbox,
  } = useGetTrainerRequestsInboxQuery(
    { trainerEmail },
    { skip: !trainerEmail }
  );

  const [acceptReq] = useAcceptTrainerRequestMutation();
  const [declineReq] = useDeclineTrainerRequestMutation();

  const [createClient, createClientState] = useCreateClientByEmailMutation();
  const [clientEmail, setClientEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const generateInvite = useCallback(async () => {
    try {
      const invite = await createInvite({
        targetEmail: null,
        expiresAt: null,
      }).unwrap();
      setGeneratedCode(invite.code);
    } catch (e: unknown) {
      appToast.error(
        mapLinkingError(
          e && typeof e === "object" && "message" in e
            ? (e as { message: string }).message
            : undefined
        )
      );
    }
  }, [createInvite]);

  useEffect(() => {
    if (!trainerId) return;
    if (didAutoGenerate.current) return;
    didAutoGenerate.current = true;
    void generateInvite();
  }, [trainerId, generateInvite]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetchInbox();
    } finally {
      setRefreshing(false);
    }
  }, [refetchInbox]);

  const onAccept = useCallback(
    async (requestId: string) => {
      try {
        await acceptReq({ requestId }).unwrap();
        appToast.success(t("linking.requests.accept"));
        await refetchInbox();
      } catch (e: unknown) {
        appToast.error(
          mapLinkingError(
            e && typeof e === "object" && "message" in e
              ? (e as { message: string }).message
              : undefined
          )
        );
      }
    },
    [acceptReq, refetchInbox, t]
  );

  const onDecline = useCallback(
    async (requestId: string) => {
      try {
        await declineReq({ requestId }).unwrap();
        appToast.info(t("linking.requests.decline"));
        await refetchInbox();
      } catch (e: unknown) {
        appToast.error(
          mapLinkingError(
            e && typeof e === "object" && "message" in e
              ? (e as { message: string }).message
              : undefined
          )
        );
      }
    },
    [declineReq, refetchInbox, t]
  );

  const onCreateClient = useCallback(async () => {
    try {
      await createClient({
        clientEmail: clientEmail.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        sendMagicLink: true,
      }).unwrap();
      appToast.success(t("linking.clients.addClient"));
      router.back();
    } catch (e: unknown) {
      appToast.error(
        mapLinkingError(
          e && typeof e === "object" && "message" in e
            ? (e as { message: string }).message
            : undefined
        )
      );
    }
  }, [clientEmail, firstName, lastName, createClient, t]);

  const pendingRequests = (inbox ?? []).filter(
    (r) => (r.status ?? "").toLowerCase() === "pending"
  );
  
  return {
    tab,
    setTab,
    generateInvite,
    generatedCode,
    createInviteState,
    inboxLoading,
    pendingRequests,
    onAccept,
    onDecline,
    clientEmail,
    setClientEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    onCreateClient,
    createClientState,
    onRefresh,
    refreshing,
  };
}
