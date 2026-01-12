import { Redirect } from "expo-router";
import { useMyProfile } from "../src/features/profile/hooks/useMyProfile";
import { FullscreenState } from "../src/shared/components/FullscreenState";
import { useAppSelector } from "../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../src/shared/i18n/useAppTranslation";

export default function Index() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);
  const { me, isLoading, error } = useMyProfile();

  // load profile once authenticated
  useMyProfile();

  if (auth.status === "idle" || auth.status === "loading") {
    return <FullscreenState title={t("state.initializing")} />;
  }

  if (auth.status === "error") {
    return (
      <FullscreenState
        title={t("state.authError")}
        subtitle={auth.errorMessage ?? ""}
      />
    );
  }

  if (auth.status === "unauthenticated") {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Authenticated: wait for profile fetch
  if (isLoading) {
    return <FullscreenState title={t("state.initializing")} />;
  }

  if (error) {
    return (
      <FullscreenState title={t("state.authError")} subtitle={error ?? ""} />
    );
  }

  if (!me) return <FullscreenState title={t("state.initializing")} />;

  const hasName = Boolean(me.firstName?.trim()) && Boolean(me.lastName?.trim());
  const roleConfirmed = Boolean(me.roleConfirmed);

  if (!hasName) return <Redirect href="/(onboarding)/profile" />;

  // User has name, but hasn’t confirmed role yet:
  if (!roleConfirmed) return <Redirect href="/(onboarding)/role" />;

  if (me.role === "trainer")
    return <Redirect href="/(trainer)/(tabs)/dashboard" />;
  return <Redirect href="/(client)/(tabs)/dashboard" />;
}
