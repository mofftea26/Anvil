import { Link } from "expo-router";
import { Controller } from "react-hook-form";

import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Text, useTheme, VStack } from "@/shared/ui";

import type { UseFormReturn } from "react-hook-form";

type ForgotPasswordFormProps = {
  form: UseFormReturn<{ email: string }>;
  onSubmit: () => void;
  isBusy: boolean;
};

export function ForgotPasswordForm({
  form,
  onSubmit,
  isBusy,
}: ForgotPasswordFormProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <VStack style={{ gap: theme.spacing.xl }}>
      <VStack style={{ gap: theme.spacing.sm }}>
        <Text weight="bold" style={{ fontSize: 28, lineHeight: 32 }}>
          {t("auth.resetPassword")}
        </Text>
        <Text muted>{t("auth.resetHint")}</Text>
      </VStack>

      <VStack style={{ gap: theme.spacing.lg }}>
        <Controller
          control={form.control}
          name="email"
          render={({ field: { value, onChange }, fieldState }) => (
            <AppInput
              label={t("auth.email")}
              value={value}
              onChangeText={onChange}
              placeholder={t("common.placeholders.email")}
              keyboardType="email-address"
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />

        <Button isLoading={isBusy} onPress={onSubmit}>
          {t("auth.sendLink")}
        </Button>

        <Link href="/(auth)/sign-in" asChild>
          <Text
            muted
            style={{ textAlign: "center", textDecorationLine: "underline" }}
          >
            {t("common.back")}
          </Text>
        </Link>
      </VStack>
    </VStack>
  );
}
