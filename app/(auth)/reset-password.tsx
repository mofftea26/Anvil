import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthActions } from "../../src/features/auth/hooks/useAuthActions";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";
import { appToast, Button, KeyboardScreen, Text, useTheme, VStack } from "../../src/shared/ui";

export default function ResetPasswordScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const { isBusy, errorMessage, doUpdatePassword } = useAuthActions();

  const schema = z
    .object({
      newPassword: z.string().min(8, t("auth.errors.passwordMin")),
      confirmPassword: z.string().min(8, t("auth.errors.passwordMin")),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: t("auth.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await doUpdatePassword(values.newPassword);
    appToast.success(t("auth.toasts.passwordUpdated"));
    router.replace("/"); // role gate
  });

  return (
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
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

        {errorMessage ? (
          <Text variant="caption" color={theme.colors.accent2}>
            {errorMessage}
          </Text>
        ) : null}

        <Button isLoading={isBusy} onPress={onSubmit}>
          {t("auth.saveNewPassword")}
        </Button>
      </VStack>
      </VStack>
    </KeyboardScreen>
  );
}
