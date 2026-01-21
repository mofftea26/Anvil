import { useCallback, useState } from "react";

import {
  useCreateTrainerRequestMutation,
  useGetClientRequestsQuery,
} from "@/features/linking/api/linkingApiSlice";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";

export function useFindTrainer() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);
  const clientId = auth.userId ?? "";

  const [trainerEmail, setTrainerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [createReq, createReqState] = useCreateTrainerRequestMutation();

  const { data, isLoading, error, refetch } = useGetClientRequestsQuery(
    { clientId },
    { skip: !clientId }
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onSubmit = useCallback(async () => {
    try {
      await createReq({
        trainerEmail: trainerEmail.trim(),
        message: message.trim() || null,
      }).unwrap();
      appToast.success(t("linking.client.sendRequest"));
      setMessage("");
      await refetch();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : t("auth.errors.generic");
      appToast.error(msg);
    }
  }, [trainerEmail, message, createReq, refetch, t]);

  return {
    trainerEmail,
    setTrainerEmail,
    message,
    setMessage,
    onSubmit,
    createReqState,
    data: data ?? [],
    isLoading,
    error,
    onRefresh,
    refreshing,
  };
}
