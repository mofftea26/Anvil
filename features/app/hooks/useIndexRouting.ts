import { useEffect, useMemo, useRef } from "react";

import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";

type IndexRoutingDecision =
  | { type: "loading"; progress: number; title: string }
  | { type: "error"; title: string; subtitle?: string }
  | { type: "redirect"; href: string; params?: Record<string, string> };

export const useIndexRouting = (): IndexRoutingDecision => {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);
  const { me, isLoading, error } = useMyProfile();

  const lastAuthErrorRef = useRef<string | null>(null);
  const authErrorMessage = auth.errorMessage ?? t("auth.errors.generic");

  useEffect(() => {
    if (auth.status === "error") {
      if (lastAuthErrorRef.current !== authErrorMessage) {
        lastAuthErrorRef.current = authErrorMessage;
        appToast.error(authErrorMessage);
      }
    }
  }, [auth.status, authErrorMessage]);

  return useMemo(() => {
    if (auth.status === "idle" || auth.status === "loading") {
      return {
        type: "loading",
        title: t("state.initializing"),
        progress: 0.35,
      };
    }

    if (auth.status === "error") {
      return {
        type: "redirect",
        href: "/(auth)/sign-in",
        params: { error: authErrorMessage },
      };
    }

    if (auth.status === "unauthenticated") {
      return { type: "redirect", href: "/(auth)/sign-in" };
    }

    if (isLoading) {
      return {
        type: "loading",
        title: t("state.initializing"),
        progress: 0.75,
      };
    }

    if (error) {
      return {
        type: "error",
        title: t("state.authError"),
        subtitle: error ?? "",
      };
    }

    if (!me) {
      return {
        type: "loading",
        title: t("state.initializing"),
        progress: 0.9,
      };
    }

    const hasName = Boolean(me.firstName?.trim()) &&
      Boolean(me.lastName?.trim());
    const roleConfirmed = Boolean(me.roleConfirmed);

    if (!hasName) {
      return { type: "redirect", href: "/(onboarding)/profile" };
    }

    if (!roleConfirmed) {
      return { type: "redirect", href: "/(onboarding)/role" };
    }

    if (me.role === "trainer") {
      return { type: "redirect", href: "/(trainer)/(tabs)/dashboard" };
    }

    return { type: "redirect", href: "/(client)/(tabs)/dashboard" };
  }, [
    auth.status,
    authErrorMessage,
    error,
    isLoading,
    me,
    t,
  ]);
};
