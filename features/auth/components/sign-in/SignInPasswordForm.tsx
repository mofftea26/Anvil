import { Link } from "expo-router";
import { Controller } from "react-hook-form";

import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, HStack, Text, useTheme, VStack } from "@/shared/ui";

import type { UseFormReturn } from "react-hook-form";

type SignInPasswordFormProps = {
  form: UseFormReturn<{ email: string; password: string }>;
  onSubmit: () => void;
  isBusy: boolean;
};

export function SignInPasswordForm({
  form,
  onSubmit,
  isBusy,
}: SignInPasswordFormProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
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

      <Controller
        control={form.control}
        name="password"
        render={({ field: { value, onChange }, fieldState }) => (
          <AppInput
            label={t("auth.password")}
            
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
        {t("auth.signIn")}
      </Button>

      <VStack style={{ alignItems: "center", gap: 10, marginTop: 4 }}>
        <Link href="/(auth)/forgot-password" asChild>
          <Text style={{ opacity: 0.85, textDecorationLine: "underline" }}>
            {t("auth.forgotPassword")}
          </Text>
        </Link>

        <HStack gap={8} align="center">
          <Text muted>{t("auth.noAccount")}</Text>
          <Link href="/(auth)/sign-up" asChild>
            <Text style={{ textDecorationLine: "underline" }}>
              {t("auth.goToSignUp")}
            </Text>
          </Link>
        </HStack>
      </VStack>
    </VStack>
  );
}
