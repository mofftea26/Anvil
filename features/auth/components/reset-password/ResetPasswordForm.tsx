import { Controller } from "react-hook-form";

import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Text, useTheme, VStack } from "@/shared/ui";

import type { UseFormReturn } from "react-hook-form";

type ResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

type ResetPasswordFormProps = {
  form: UseFormReturn<ResetPasswordFormValues>;
  onSubmit: () => void;
  isBusy: boolean;
};

export function ResetPasswordForm({
  form,
  onSubmit,
  isBusy,
}: ResetPasswordFormProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <VStack style={{ gap: theme.spacing.xl }}>
      <VStack style={{ gap: theme.spacing.sm }}>
        <Text weight="bold" style={{ fontSize: 28, lineHeight: 32 }}>
          {t("auth.resetPassword")}
        </Text>
        <Text muted>{t("auth.saveNewPassword")}</Text>
      </VStack>

      <VStack style={{ gap: theme.spacing.lg }}>
        <Controller
          control={form.control}
          name="newPassword"
          render={({ field: { value, onChange }, fieldState }) => (
            <AppInput
              label={t("auth.newPassword")}
              value={value}
              onChangeText={onChange}
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field: { value, onChange }, fieldState }) => (
            <AppInput
              label={t("auth.confirmPassword")}
              value={value}
              onChangeText={onChange}
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />

        <Button isLoading={isBusy} onPress={onSubmit}>
          {t("auth.saveNewPassword")}
        </Button>
      </VStack>
    </VStack>
  );
}
