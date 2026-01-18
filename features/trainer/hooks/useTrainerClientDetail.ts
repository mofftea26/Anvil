import { useCallback, useEffect, useMemo, useState } from "react";

import { router, useLocalSearchParams } from "expo-router";

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
import {
  appToast,
  useAppAlert,
  useStickyHeaderHeight,
  useTheme,
} from "@/shared/ui";

type ManagementForm = {
  clientStatus: "active" | "paused" | "inactive";
  checkInFrequency: "weekly" | "biweekly" | "monthly" | "custom";
  nextCheckInAt: string | null;
  coachNotes: string;
};

type AvatarPresentation = {
  bg: string;
  imageUrl?: string;
  initials?: string | null;
};

const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "").trim();
  const hasAlpha = h.length === 8;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const finalA = Math.max(0, Math.min(1, alpha * a));
  return `rgba(${r},${g},${b},${finalA})`;
};

const getInitials = (
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | null => {
  const a = (firstName ?? "").trim();
  const b = (lastName ?? "").trim();
  const s = `${a} ${b}`.trim();
  if (!s) return null;
  const parts = s.split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const initials = (first + second).toUpperCase();
  return initials || null;
};

const hashStringToInt = (input: string): number => {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const pickAvatarBg = (seed: string): string => {
  const palette = [
    "#7C3AED",
    "#38BDF8",
    "#22C55E",
    "#F97316",
    "#F43F5E",
    "#A855F7",
    "#06B6D4",
  ];
  const idx = hashStringToInt(seed) % palette.length;
  return palette[idx];
};

const formatDatePretty = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

export const useTrainerClientDetail = () => {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const headerHeight = useStickyHeaderHeight();
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
  useEffect(() => {
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
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
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
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
    }
  }, [clientId, managementForm.nextCheckInAt, markCheckIn, refreshAll, t]);

  const toggleArchive = useCallback(async () => {
    try {
      await setLinkStatus({
        clientId,
        status: isArchived ? "active" : "archived",
      }).unwrap();
      await refreshAll();
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
    }
  }, [clientId, isArchived, refreshAll, setLinkStatus, t]);

  const doDelete = useCallback(async () => {
    try {
      await deleteLink({ clientId }).unwrap();
      appToast.success(t("common.done"));
      router.back();
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      if (msg.toLowerCase().includes("archived")) {
        appToast.error(t("linking.clients.mustArchiveBeforeDelete"));
      } else {
        appToast.error(msg || t("auth.errors.generic"));
      }
    }
  }, [clientId, deleteLink, t]);

  const onDeletePress = useCallback(() => {
    alert.confirm({
      title: t("linking.clients.deleteClient"),
      message: t("common.areYouSure"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        await doDelete();
      },
    });
  }, [alert, doDelete, t]);

  const avatar = useMemo<AvatarPresentation>(() => {
    const avatarUrl = clientUser?.avatarUrl ?? "";
    const seed = clientUser?.id || clientUser?.email || clientId;
    return {
      bg: avatarUrl ? "rgba(255,255,255,0.10)" : pickAvatarBg(seed),
      imageUrl: avatarUrl || undefined,
      initials: avatarUrl
        ? undefined
        : getInitials(clientUser?.firstName, clientUser?.lastName),
    };
  }, [clientId, clientUser?.avatarUrl, clientUser?.email, clientUser?.firstName, clientUser?.id, clientUser?.lastName]);

  const headerGradient = useMemo(
    () => [
      hexToRgba(theme.colors.accent, 0.45),
      hexToRgba(theme.colors.accent2, 0.3),
      "rgba(0,0,0,0.00)",
    ],
    [theme.colors.accent, theme.colors.accent2]
  );

  const linksErrorMessage = linksError
    ? (linksError as any)?.message ?? t("auth.errors.generic")
    : null;
  const profileErrorMessage = profileError
    ? (profileError as any)?.message ?? t("auth.errors.generic")
    : null;

  return {
    t,
    theme,
    alert,
    headerHeight,
    clientId,
    clientProfile,
    clientUser,
    fullName,
    isArchived,
    linksLoading,
    profileLoading,
    linksErrorMessage,
    profileErrorMessage,
    managementForm,
    statusOptions,
    freqOptions,
    showDatePicker,
    setShowDatePicker,
    setManagementForm,
    refreshing,
    onRefresh,
    saveManagement,
    quickSetStatus,
    markNextCheckIn,
    toggleArchive,
    onDeletePress,
    headerGradient,
    avatar,
    upsertState,
    setClientStatusState,
    markCheckInState,
    setLinkStatusState,
    deleteState,
  };
};

export { formatDatePretty };
