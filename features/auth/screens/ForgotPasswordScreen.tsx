import { useLocalSearchParams } from "expo-router";

import { CheckEmailView } from "@/features/auth/components/forgot-password/CheckEmailView";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password/ForgotPasswordForm";
import { useForgotPasswordForm } from "@/features/auth/hooks/forgot-password/useForgotPasswordForm";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, KeyboardScreen, useTheme } from "@/shared/ui";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode;
  const { t } = useAppTranslation();

  const { form, onSubmit, isBusy } = useForgotPasswordForm({
    onSuccess: () => appToast.success(t("auth.toasts.resetLinkSent")),
  });

  if (mode === "magic" || mode === "signup") {
    return (
      <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
        <CheckEmailView />
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
      <ForgotPasswordForm form={form} onSubmit={onSubmit} isBusy={isBusy} />
    </KeyboardScreen>
  );
}
