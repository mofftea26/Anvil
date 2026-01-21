import { router } from "expo-router";
import { useCallback, useState } from "react";

import {
  useCancelTrainerRequestMutation,
  useCreateTrainerRequestMutation,
  useGetClientRequestsQuery,
  useRedeemInviteCodeMutation,
} from "@/features/linking/api/linkingApiSlice";
import { mapLinkingError } from "@/features/linking/utils/linkingErrors";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";

export type LinkTrainerTab = "redeem" | "request";

export function useLinkTrainer() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);
  const clientId = auth.userId ?? "";

  const [tab, setTab] = useState<LinkTrainerTab>("redeem");
  const [code, setCode] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [redeem, redeemState] = useRedeemInviteCodeMutation();
  const [requestTrainer, requestState] = useCreateTrainerRequestMutation();
  const [cancelReq] = useCancelTrainerRequestMutation();

  const { data: myRequests, refetch: refetchRequests } =
    useGetClientRequestsQuery({ clientId }, { skip: !clientId });

  const switchTab = useCallback((next: LinkTrainerTab) => {
    setInlineError(null);
    setTab(next);
  }, []);

  const onRedeem = useCallback(async () => {
    setInlineError(null);
    try {
      await redeem({ code: code.trim() }).unwrap();
      appToast.success(t("linking.client.redeem"));
      router.replace("/");
    } catch (e: unknown) {
      const msg = mapLinkingError(
        e && typeof e === "object" && "message" in e
          ? (e as { message: string }).message
          : undefined
      );
      setInlineError(msg);
      appToast.error(msg);
    }
  }, [code, redeem, t]);

  const onRequest = useCallback(async () => {
    setInlineError(null);
    try {
      await requestTrainer({
        trainerEmail: trainerEmail.trim(),
        message: message.trim() || null,
      }).unwrap();
      appToast.success(t("linking.client.sendRequest"));
      await refetchRequests();
    } catch (e: unknown) {
      const msg = mapLinkingError(
        e && typeof e === "object" && "message" in e
          ? (e as { message: string }).message
          : undefined
      );
      setInlineError(msg);
      appToast.error(msg);
    }
  }, [trainerEmail, message, requestTrainer, refetchRequests, t]);

  const onCancelRequest = useCallback(
    async (requestId: string) => {
      try {
        await cancelReq({ requestId }).unwrap();
        appToast.info(t("linking.requests.cancel"));
        await refetchRequests();
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
    [cancelReq, refetchRequests, t]
  );

  return {
    tab,
    switchTab,
    code,
    setCode,
    trainerEmail,
    setTrainerEmail,
    message,
    setMessage,
    inlineError,
    onRedeem,
    onRequest,
    onCancelRequest,
    redeemState,
    requestState,
    myRequests: myRequests ?? [],
    refetchRequests,
  };
}
