import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch } from "../../../shared/hooks/useAppDispatch";
import { useAppSelector } from "../../../shared/hooks/useAppSelector";
import i18n from "../../../shared/i18n/i18n";
import {
  useGetClientProfileQuery,
  useGetMyUserRowQuery,
  useGetTrainerProfileQuery,
} from "../api/profileApiSlice";
import { profileActions } from "../store/profileSlice";
import type { ClientProfile, TrainerProfile, UserRow } from "../types/profile";

type UseMyProfileResult = {
  isLoading: boolean;
  error: string | null;
  me: UserRow | null;
  clientProfile: ClientProfile | null;
  trainerProfile: TrainerProfile | null;
  refetch: () => Promise<void>;
};

export function useMyProfile(): UseMyProfileResult {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);

  const me = useAppSelector((s) => s.profile.me);
  const clientProfile = useAppSelector((s) => s.profile.clientProfile);
  const trainerProfile = useAppSelector((s) => s.profile.trainerProfile);

  const userId = auth.userId;

  const {
    data: meData,
    isLoading: isMeLoading,
    isFetching: isMeFetching,
    error: meError,
    refetch: refetchMe,
  } = useGetMyUserRowQuery(userId!, { skip: !userId });

  const role = meData?.role;

  const {
    data: trainerData,
    isLoading: isTrainerLoading,
    isFetching: isTrainerFetching,
    error: trainerError,
    refetch: refetchTrainer,
  } = useGetTrainerProfileQuery(userId!, { skip: !userId || role !== "trainer" });

  const {
    data: clientData,
    isLoading: isClientLoading,
    isFetching: isClientFetching,
    error: clientError,
    refetch: refetchClient,
  } = useGetClientProfileQuery(userId!, { skip: !userId || role !== "client" });

  useEffect(() => {
    dispatch(profileActions.setMe(meData ?? null));
  }, [dispatch, meData]);

  useEffect(() => {
    if (!role) return;
    if (role === "trainer") {
      dispatch(profileActions.setTrainerProfile(trainerData ?? null));
      dispatch(profileActions.setClientProfile(null));
    } else {
      dispatch(profileActions.setClientProfile(clientData ?? null));
      dispatch(profileActions.setTrainerProfile(null));
    }
  }, [clientData, dispatch, role, trainerData]);

  const error = useMemo(() => {
    const err = (meError ?? trainerError ?? clientError) as any;
    if (!err) return null;
    if (typeof err?.message === "string") return err.message;
    if (typeof err?.error === "string") return err.error;
    return i18n.t("profile.errors.loadFailed");
  }, [clientError, meError, trainerError]);

  const isLoading =
    isMeLoading ||
    isTrainerLoading ||
    isClientLoading ||
    isMeFetching ||
    isTrainerFetching ||
    isClientFetching;

  const refetch = useCallback(async () => {
    if (!userId) return;
    const tasks: Promise<any>[] = [refetchMe()];
    if (role === "trainer") tasks.push(refetchTrainer());
    if (role === "client") tasks.push(refetchClient());
    await Promise.all(tasks);
  }, [refetchClient, refetchMe, refetchTrainer, role, userId]);

  return { isLoading, error, me, clientProfile, trainerProfile, refetch };
}
