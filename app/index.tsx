import { Redirect } from "expo-router";
import React from "react";
import { useMyProfile } from "../src/features/profile/hooks/useMyProfile";
import { FullscreenState } from "../src/shared/components/FullscreenState";
import { useAppSelector } from "../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../src/shared/i18n/useAppTranslation";
import { appToast } from "../src/shared/ui";

export default function Index() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);
  const { me, isLoading, error } = useMyProfile();

  const lastAuthErrorRef = React.useRef<string | null>(null);

  // Show error toast in useEffect to avoid state update during render
  React.useEffect(() => {
    if (auth.status === "error") {
      const msg = auth.errorMessage ?? t("auth.errors.generic");
      if (lastAuthErrorRef.current !== msg) {
        lastAuthErrorRef.current = msg;
        // show once per error message
        appToast.error(msg);
      }
    }
  }, [auth.status, auth.errorMessage, t]);

  if (auth.status === "idle" || auth.status === "loading") {
    return <FullscreenState title={t("state.initializing")} progress={0.35} />;
  }

  if (auth.status === "error") {
    const msg = auth.errorMessage ?? t("auth.errors.generic");

    return (
      <Redirect
        href={{
          pathname: "/(auth)/sign-in",
          params: { error: msg },
        }}
      />
    );
  }

  if (auth.status === "unauthenticated") {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Authenticated: wait for profile fetch
  if (isLoading) {
    return <FullscreenState title={t("state.initializing")} progress={0.75} />;
  }

  if (error) {
    return (
      <FullscreenState title={t("state.authError")} subtitle={error ?? ""} />
    );
  }

  if (!me)
    return <FullscreenState title={t("state.initializing")} progress={0.9} />;

  const hasName = Boolean(me.firstName?.trim()) && Boolean(me.lastName?.trim());
  const roleConfirmed = Boolean(me.roleConfirmed);

  if (!hasName) return <Redirect href="/(onboarding)/profile" />;

  // User has name, but hasn’t confirmed role yet:
  if (!roleConfirmed) return <Redirect href="/(onboarding)/role" />;

  if (me.role === "trainer")
    return <Redirect href="/(trainer)/(tabs)/dashboard" />;
  return <Redirect href="/(client)/(tabs)/dashboard" />;
}
