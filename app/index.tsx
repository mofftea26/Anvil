import { Redirect } from "expo-router";
import { FullscreenState } from "../src/shared/components/FullscreenState";
import { useAppSelector } from "../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../src/shared/i18n/useAppTranslation";

export default function Index() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);

  // Loading / bootstrapping
  if (auth.status === "idle" || auth.status === "loading") {
    return <FullscreenState title={t("state.initializing")} />;
  }

  // Error
  if (auth.status === "error") {
    return (
      <FullscreenState
        title={t("state.authError")}
        subtitle={auth.errorMessage ?? ""}
      />
    );
  }

  // Not signed in
  if (auth.status === "unauthenticated") {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Signed in, waiting for role
  if (auth.status === "authenticated" && !auth.role) {
    return <FullscreenState title={t("state.initializing")} />;
  }

  // Signed in + role known
  if (auth.role === "trainer") return <Redirect href="/(trainer)" />;
  return <Redirect href="/(client)" />;
}
