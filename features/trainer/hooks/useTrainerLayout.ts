import { useMemo } from "react";

import { useAppSelector } from "@/shared/hooks/useAppSelector";

type TrainerLayoutDecision =
  | { type: "redirect"; href: string }
  | { type: "render" };

export const useTrainerLayout = (): TrainerLayoutDecision => {
  const auth = useAppSelector((s) => s.auth);
  const me = useAppSelector((s) => s.profile.me);

  return useMemo(() => {
    if (auth.status === "unauthenticated") {
      return { type: "redirect", href: "/(auth)/sign-in" };
    }

    if (auth.status === "authenticated" && me?.role === "client") {
      return { type: "redirect", href: "/(client)/(tabs)/dashboard" };
    }

    return { type: "render" };
  }, [auth.status, me?.role]);
};
