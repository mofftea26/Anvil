import { router } from "expo-router";

import { ResetPasswordForm } from "@/features/auth/components/reset-password/ResetPasswordForm";
import { useResetPasswordForm } from "@/features/auth/hooks/reset-password/useResetPasswordForm";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, KeyboardScreen, useTheme } from "@/shared/ui";

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const { form, onSubmit, isBusy } = useResetPasswordForm({
    onSuccess: () => {
      appToast.success(t("auth.toasts.passwordUpdated"));
      router.replace("/");
    },
  });

  return (
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
      <ResetPasswordForm form={form} onSubmit={onSubmit} isBusy={isBusy} />
    </KeyboardScreen>
  );
}
