import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";

import { formatDatePretty, hexToRgba } from "@/features/clients/utils/clientUi";
import {
  useDeleteArchivedClientLinkMutation,
  useGetTrainerClientsQuery,
  useMarkClientCheckInMutation,
  useSetTrainerClientStatusMutation,
  useUpsertTrainerClientManagementMutation,
} from "@/features/linking/api/linkingApiSlice";
import { useGetClientProfileQuery } from "@/features/profile/api/profileApiSlice";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";

export type ManagementForm = {
  clientStatus: "active" | "paused" | "inactive";
  checkInFrequency: "weekly" | "biweekly" | "monthly" | "custom";
  nextCheckInAt: string | null;
  coachNotes: string;
};

export function useTrainerClientDetails() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);
  const params = useLocalSearchParams<{ clientId?: string }>();

  const clientId = String(params.clientId ?? "");
  const trainerId = auth.userId ?? "";

  const {
    data: links,
    isLoading: linksLoading,
    error: linksError,
    refetch: refetchLinks,
  } = useGetTrainerClientsQuery({ trainerId }, { skip: !trainerId });

  const link = useMemo(
    () => links?.find((l) => l.clientId === clientId) ?? null,
    [links, clientId]
  );

  const clientUser = link?.client ?? null;
  const fullName =
    clientUser?.firstName || clientUser?.lastName
      ? `${clientUser?.firstName ?? ""} ${clientUser?.lastName ?? ""}`.trim()
      : clientUser?.email ?? "—";

  const isArchived = link?.status === "archived";

  const {
    data: clientProfile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetClientProfileQuery(clientId, { skip: !clientId });

  const [upsertManagement, upsertState] =
    useUpsertTrainerClientManagementMutation();
  const [markCheckIn, markCheckInState] = useMarkClientCheckInMutation();
  const [setLinkStatus, setLinkStatusState] =
    useSetTrainerClientStatusMutation();
  const [deleteLink, deleteState] = useDeleteArchivedClientLinkMutation();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [managementForm, setManagementForm] = useState<ManagementForm>({
    clientStatus: "active",
    checkInFrequency: "weekly",
    nextCheckInAt: null,
    coachNotes: "",
  });

  const management = link?.management ?? null;
  React.useEffect(() => {
    if (!management) return;
    setManagementForm({
      clientStatus: management.clientStatus,
      checkInFrequency: management.checkInFrequency,
      nextCheckInAt: management.nextCheckInAt,
      coachNotes: management.coachNotes ?? "",
    });
  }, [management]);

  const statusOptions = useMemo(
    () => [
      { value: "active", label: t("linking.management.status.active") },
      { value: "paused", label: t("linking.management.status.paused") },
      { value: "inactive", label: t("linking.management.status.inactive") },
    ],
    [t]
  );

  const freqOptions = useMemo(
    () => [
      { value: "weekly", label: t("linking.management.frequency.weekly") },
      { value: "biweekly", label: t("linking.management.frequency.biweekly") },
      { value: "monthly", label: t("linking.management.frequency.monthly") },
      { value: "custom", label: t("linking.management.frequency.custom") },
    ],
    [t]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([refetchLinks(), refetchProfile()]);
  }, [refetchLinks, refetchProfile]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  const saveManagement = useCallback(async () => {
    try {
      await upsertManagement({
        clientId,
        clientStatus: managementForm.clientStatus,
        checkInFrequency: managementForm.checkInFrequency,
        nextCheckInAt: managementForm.nextCheckInAt,
        coachNotes: managementForm.coachNotes.trim()
          ? managementForm.coachNotes.trim()
          : null,
      }).unwrap();
      appToast.success(t("profile.toasts.saved"));
      await refreshAll();
    } catch (e: unknown) {
      appToast.error((e as { message?: string })?.message ?? t("auth.errors.generic"));
    }
  }, [clientId, managementForm, refreshAll, t, upsertManagement]);

  const markNextCheckIn = useCallback(async () => {
    if (!managementForm.nextCheckInAt) {
      appToast.error(t("linking.management.nextCheckInMissing"));
      return;
    }
    try {
      await markCheckIn({
        clientId,
        nextCheckInAt: managementForm.nextCheckInAt,
      }).unwrap();
      appToast.success(t("profile.toasts.saved"));
      await refreshAll();
    } catch (e: unknown) {
      appToast.error((e as { message?: string })?.message ?? t("auth.errors.generic"));
    }
  }, [clientId, managementForm.nextCheckInAt, markCheckIn, refreshAll, t]);

  const toggleArchive = useCallback(async () => {
    try {
      await setLinkStatus({
        clientId,
        status: isArchived ? "active" : "archived",
      }).unwrap();
      await refreshAll();
    } catch (e: unknown) {
      appToast.error((e as { message?: string })?.message ?? t("auth.errors.generic"));
    }
  }, [clientId, isArchived, refreshAll, setLinkStatus, t]);

  const doDelete = useCallback(async () => {
    try {
      await deleteLink({ clientId }).unwrap();
      appToast.success(t("common.done"));
      router.back();
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? "");
      if (msg.toLowerCase().includes("archived")) {
        appToast.error(t("linking.clients.mustArchiveBeforeDelete"));
      } else {
        appToast.error(msg || t("auth.errors.generic"));
      }
    }
  }, [clientId, deleteLink, t]);

  const setNextCheckInDate = useCallback((date: Date | undefined) => {
    if (!date) return;
    setManagementForm((prev) => ({
      ...prev,
      nextCheckInAt: date.toISOString(),
    }));
  }, []);

  return {
    clientId,
    clientUser,
    clientProfile,
    fullName,
    isArchived,
    link,
    managementForm,
    setManagementForm,
    showDatePicker,
    setShowDatePicker,
    statusOptions,
    freqOptions,
    linksError,
    profileError,
    linksLoading,
    profileLoading,
    refreshing,
    onRefresh,
    saveManagement,
    markNextCheckIn,
    toggleArchive,
    doDelete,
    upsertLoading: upsertState.isLoading,
    markCheckInLoading: markCheckInState.isLoading,
    setLinkStatusLoading: setLinkStatusState.isLoading,
    deleteLoading: deleteState.isLoading,
    hexToRgba,
    formatDatePretty,
    setNextCheckInDate,
  };
}
