import { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "../../../shared/hooks/useAppDispatch";
import { useAppSelector } from "../../../shared/hooks/useAppSelector";
import {
  getClientProfile,
  getMyUserRow,
  getTrainerProfile,
} from "../api/profileApi";
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!auth.userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = await getMyUserRow(auth.userId);
      dispatch(profileActions.setMe(user));

      if (user.role === "trainer") {
        const tp = await getTrainerProfile(auth.userId);
        dispatch(profileActions.setTrainerProfile(tp));
        dispatch(profileActions.setClientProfile(null));
      } else {
        const cp = await getClientProfile(auth.userId);
        dispatch(profileActions.setClientProfile(cp));
        dispatch(profileActions.setTrainerProfile(null));
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [auth.userId, dispatch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { isLoading, error, me, clientProfile, trainerProfile, refetch };
}
