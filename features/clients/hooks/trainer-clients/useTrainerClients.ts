import React, { useCallback, useState } from "react";

import {
  useGetTrainerClientsQuery,
  useSetTrainerClientStatusMutation,
} from "@/features/linking/api/linkingApiSlice";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";

export function useTrainerClients() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);

  const trainerId = auth.userId ?? "";
  const { data, isLoading, error, refetch } = useGetTrainerClientsQuery(
    { trainerId },
    { skip: !trainerId }
  );
  const [setStatus, setStatusState] = useSetTrainerClientStatusMutation();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onArchive = useCallback(
    async (clientId: string, isArchived: boolean) => {
      try {
        await setStatus({
          clientId,
          status: isArchived ? "active" : "archived",
        }).unwrap();
        await refetch();
      } catch (e: unknown) {
        appToast.error(
          (e as { message?: string })?.message ?? t("auth.errors.generic")
        );
      }
    },
    [refetch, setStatus, t]
  );

  return {
    data,
    isLoading,
    error,
    refreshing,
    onRefresh,
    onArchive,
    archiveLoading: setStatusState.isLoading,
    trainerId,
  };
}
