import { useCallback, useMemo, useState } from "react";

import { router } from "expo-router";

import {
  useClientCancelTrainerMutation,
  useClientSetRelationshipStatusMutation,
  useGetMyCoachQuery,
} from "@/features/linking/api/linkingApiSlice";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  useAppAlert,
  useStickyHeaderHeight,
  useTheme,
} from "@/shared/ui";

type AvatarPresentation = {
  bg: string;
  imageUrl?: string;
  initials?: string | null;
};

const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
  }).format(d);
};

const parseCerts = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
};

const getInitials = (firstName: string, lastName: string): string | null => {
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

const isHexColor = (value: string) => {
  const s = value.trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
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

export const useClientCoach = () => {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const headerHeight = useStickyHeaderHeight();
  const auth = useAppSelector((s) => s.auth);
  const clientId = auth.userId ?? "";

  const { data, isLoading, error, refetch } = useGetMyCoachQuery(
    { clientId },
    { skip: !clientId }
  );

  const [setRelStatus, setRelStatusState] =
    useClientSetRelationshipStatusMutation();
  const [cancelTrainer, cancelTrainerState] = useClientCancelTrainerMutation();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const coachName =
    data?.trainer?.firstName || data?.trainer?.lastName
      ? `${data?.trainer?.firstName ?? ""} ${data?.trainer?.lastName ?? ""}`.trim()
      : data?.trainer?.email ?? "—";

  const relationshipStatus =
    data?.management?.clientRelationshipStatus ?? "active";
  const nextCheckIn = data?.management?.nextCheckInAt ?? null;
  const certs = useMemo(
    () => parseCerts(data?.trainerProfile?.certifications),
    [data?.trainerProfile?.certifications]
  );

  const doPause = useCallback(async () => {
    if (!data?.trainer?.id) return;
    try {
      await setRelStatus({
        trainerId: data.trainer.id,
        status: "paused",
        pauseReason: null,
      }).unwrap();
      appToast.success(t("profile.toasts.saved"));
      await refetch();
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
    }
  }, [data?.trainer?.id, refetch, setRelStatus, t]);

  const doResume = useCallback(async () => {
    if (!data?.trainer?.id) return;
    try {
      await setRelStatus({
        trainerId: data.trainer.id,
        status: "active",
        pauseReason: null,
      }).unwrap();
      appToast.success(t("profile.toasts.saved"));
      await refetch();
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
    }
  }, [data?.trainer?.id, refetch, setRelStatus, t]);

  const doDisconnect = useCallback(async () => {
    if (!data?.trainer?.id) return;
    try {
      await cancelTrainer({ trainerId: data.trainer.id }).unwrap();
      appToast.success(t("common.done"));
      await refetch();
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
    }
  }, [cancelTrainer, data?.trainer?.id, refetch, t]);

  const onPausePress = useCallback(() => {
    alert.confirm({
      title: t("linking.coach.pauseTitle"),
      message: t("linking.coach.pauseMessage"),
      confirmText: t("linking.coach.pause"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        await doPause();
      },
    });
  }, [alert, doPause, t]);

  const onResumePress = useCallback(() => {
    alert.confirm({
      title: t("linking.coach.resumeTitle"),
      message: t("linking.coach.resumeMessage"),
      confirmText: t("linking.coach.resume"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        await doResume();
      },
    });
  }, [alert, doResume, t]);

  const onDisconnectPress = useCallback(() => {
    alert.confirm({
      title: t("linking.coach.disconnectTitle"),
      message: t("linking.coach.disconnectMessage"),
      confirmText: t("linking.coach.disconnect"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        await doDisconnect();
      },
    });
  }, [alert, doDisconnect, t]);

  const primary = data?.trainerProfile?.primaryColor ?? "";
  const secondary = data?.trainerProfile?.secondaryColor ?? "";
  const brandA = primary && isHexColor(primary) ? primary : "#7C3AED";
  const brandB = secondary && isHexColor(secondary) ? secondary : "#38BDF8";

  const pageGradient = useMemo(
    () => [hexToRgba(brandA, 0.5), hexToRgba(brandB, 0.35), "rgba(0,0,0,0.00)"],
    [brandA, brandB]
  );

  const avatar = useMemo<AvatarPresentation>(() => {
    const avatarUrl = data?.trainer?.avatarUrl ?? "";
    const seed = data?.trainer?.id || data?.trainer?.email || "seed";
    return {
      bg: avatarUrl ? "rgba(255,255,255,0.10)" : pickAvatarBg(seed),
      imageUrl: avatarUrl || undefined,
      initials: avatarUrl
        ? undefined
        : getInitials(data?.trainer?.firstName ?? "", data?.trainer?.lastName ?? ""),
    };
  }, [data?.trainer?.avatarUrl, data?.trainer?.email, data?.trainer?.firstName, data?.trainer?.id, data?.trainer?.lastName]);

  const errorMessage = error
    ? (error as any)?.message ?? t("auth.errors.generic")
    : null;

  return {
    t,
    theme,
    headerHeight,
    data,
    coachName,
    relationshipStatus,
    nextCheckIn,
    certs,
    isLoading,
    errorMessage,
    refreshing,
    onRefresh,
    onPausePress,
    onResumePress,
    onDisconnectPress,
    setRelStatusState,
    cancelTrainerState,
    pageGradient,
    avatar,
    formatShortDate,
  };
};
