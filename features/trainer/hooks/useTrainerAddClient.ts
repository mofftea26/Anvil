import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";

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
import { appToast, useStickyHeaderHeight, useTheme } from "@/shared/ui";

type Tab = "invite" | "requests" | "create";

type CreateClientForm = {
  clientEmail: string;
  firstName: string;
  lastName: string;
};

export const useTrainerAddClient = () => {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const headerHeight = useStickyHeaderHeight();
  const auth = useAppSelector((s) => s.auth);
  const { me } = useMyProfile();

  const [tab, setTab] = useState<Tab>("invite");

  const trainerId = auth.userId ?? "";
  const trainerEmail = me?.email ?? "";

  const [createInvite, createInviteState] = useCreateTrainerInviteMutation();
  const [generatedCode, setGeneratedCode] = useState<string>("");
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
  const [form, setForm] = useState<CreateClientForm>({
    clientEmail: "",
    firstName: "",
    lastName: "",
  });

  const updateForm = useCallback(
    (key: keyof CreateClientForm, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const generateInvite = useCallback(async () => {
    try {
      const invite = await createInvite({
        targetEmail: null,
        expiresAt: null,
      }).unwrap();
      setGeneratedCode(invite.code);
    } catch (err: any) {
      appToast.error(mapLinkingError(err?.message));
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

  const pendingRequests = useMemo(
    () => inbox?.filter((r) => r.status === "pending") ?? [],
    [inbox]
  );

  const onCopyCode = useCallback(async () => {
    if (!generatedCode) return;
    await Clipboard.setStringAsync(generatedCode);
    appToast.success(t("linking.invite.copied"));
  }, [generatedCode, t]);

  const onAcceptRequest = useCallback(
    async (requestId: string) => {
      try {
        await acceptReq({ requestId }).unwrap();
        appToast.success(t("linking.requests.accept"));
        await refetchInbox();
      } catch (err: any) {
        appToast.error(mapLinkingError(err?.message));
      }
    },
    [acceptReq, refetchInbox, t]
  );

  const onDeclineRequest = useCallback(
    async (requestId: string) => {
      try {
        await declineReq({ requestId }).unwrap();
        appToast.info(t("linking.requests.decline"));
        await refetchInbox();
      } catch (err: any) {
        appToast.error(mapLinkingError(err?.message));
      }
    },
    [declineReq, refetchInbox, t]
  );

  const onCreateClient = useCallback(async () => {
    try {
      await createClient({
        clientEmail: form.clientEmail.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        sendMagicLink: true,
      }).unwrap();
      appToast.success(t("linking.clients.addClient"));
      router.back();
    } catch (err: any) {
      appToast.error(mapLinkingError(err?.message));
    }
  }, [createClient, form, t]);

  const segmentedItems = useMemo(
    () => [
      { key: "invite" as const, label: t("linking.addClient.inviteCode") },
      { key: "requests" as const, label: t("linking.addClient.requests") },
      { key: "create" as const, label: t("linking.addClient.createByEmail") },
    ],
    [t]
  );

  return {
    t,
    theme,
    headerHeight,
    tab,
    setTab,
    generatedCode,
    createInviteState,
    inboxLoading,
    pendingRequests,
    refreshing,
    onRefresh,
    generateInvite,
    onCopyCode,
    onAcceptRequest,
    onDeclineRequest,
    form,
    updateForm,
    onCreateClient,
    createClientState,
    segmentedItems,
  };
};

export type { Tab };
