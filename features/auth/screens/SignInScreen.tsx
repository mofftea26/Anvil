import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

import { SignInMagicForm } from "@/features/auth/components/sign-in/SignInMagicForm";
import { SignInModeSwitch } from "@/features/auth/components/sign-in/SignInModeSwitch";
import { SignInPasswordForm } from "@/features/auth/components/sign-in/SignInPasswordForm";
import { useSignInForm } from "@/features/auth/hooks/sign-in/useSignInForm";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, KeyboardScreen, Text, useTheme, VStack } from "@/shared/ui";

export default function SignInScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ error?: string }>();
  const redirectedError = typeof params.error === "string" ? params.error : null;

  const {
    mode,
    switchMode,
    passwordForm,
    magicForm,
    onPasswordSubmit,
    onMagicSubmit,
    isBusy,
  } = useSignInForm({
    onPasswordSuccess: () => router.replace("/"),
    onMagicSuccess: () => {
      appToast.success(t("auth.toasts.magicLinkSent"));
      router.push({ pathname: "/(auth)/forgot-password", params: { mode: "magic" } });
    },
  });

  useEffect(() => {
    if (!redirectedError) return;
    appToast.error(redirectedError);
  }, [redirectedError]);

  return (
    <KeyboardScreen centerIfShort style={{ padding: theme.spacing.xl }}>
      <VStack style={{ gap: theme.spacing.xl }}>
        <VStack style={{ gap: theme.spacing.sm }}>
          <Text weight="bold" style={{ fontSize: 30, lineHeight: 34 }}>
            {t("auth.title")}
          </Text>
          <Text muted>{t("auth.subtitle")}</Text>
        </VStack>

        <SignInModeSwitch mode={mode} onSwitch={switchMode} />

        {mode === "password" ? (
          <SignInPasswordForm
            form={passwordForm}
            onSubmit={onPasswordSubmit}
            isBusy={isBusy}
          />
        ) : (
          <SignInMagicForm
            form={magicForm}
            onSubmit={onMagicSubmit}
            isBusy={isBusy}
          />
        )}
      </VStack>
    </KeyboardScreen>
  );
}
