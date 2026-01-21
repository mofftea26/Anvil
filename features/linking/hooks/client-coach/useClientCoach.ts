import { useCallback, useMemo, useState } from "react";

import {
  useClientCancelTrainerMutation,
  useClientSetRelationshipStatusMutation,
  useGetMyCoachQuery,
} from "@/features/linking/api/linkingApiSlice";
import {
  hexToRgba,
  isHexColor,
  parseCerts,
  formatShortDate,
} from "@/features/linking/utils/coachFormatting";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";

export function useClientCoach() {
  const { t } = useAppTranslation();
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

  const coachName = useMemo(
    () =>
      data?.trainer?.firstName || data?.trainer?.lastName
        ? `${data?.trainer?.firstName ?? ""} ${data?.trainer?.lastName ?? ""}`.trim()
        : data?.trainer?.email ?? "—",
    [data?.trainer]
  );

  const relationshipStatus =
    data?.management?.clientRelationshipStatus ?? "active";
  const nextCheckIn = data?.management?.nextCheckInAt ?? null;

  const certs = useMemo(
    () => parseCerts(data?.trainerProfile?.certifications),
    [data?.trainerProfile?.certifications]
  );

  const primary = data?.trainerProfile?.primaryColor ?? "";
  const secondary = data?.trainerProfile?.secondaryColor ?? "";
  const brandA = primary && isHexColor(primary) ? primary : "#7C3AED";
  const brandB = secondary && isHexColor(secondary) ? secondary : "#38BDF8";

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
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
        ? (e as { message: string }).message
        : t("auth.errors.generic");
      appToast.error(msg);
    }
  }, [data?.trainer?.id, setRelStatus, refetch, t]);

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
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
        ? (e as { message: string }).message
        : t("auth.errors.generic");
      appToast.error(msg);
    }
  }, [data?.trainer?.id, setRelStatus, refetch, t]);

  const doDisconnect = useCallback(async () => {
    if (!data?.trainer?.id) return;
    try {
      await cancelTrainer({ trainerId: data.trainer.id }).unwrap();
      appToast.success(t("common.done"));
      await refetch();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
        ? (e as { message: string }).message
        : t("auth.errors.generic");
      appToast.error(msg);
    }
  }, [data?.trainer?.id, cancelTrainer, refetch, t]);

  return {
    data,
    isLoading,
    error,
    refreshing,
    onRefresh,
    coachName,
    relationshipStatus,
    nextCheckIn: nextCheckIn ? formatShortDate(nextCheckIn) : "—",
    certs,
    brandA,
    brandB,
    doPause,
    doResume,
    doDisconnect,
    isPauseResumeLoading: setRelStatusState.isLoading,
    isDisconnectLoading: cancelTrainerState.isLoading,
  };
}
