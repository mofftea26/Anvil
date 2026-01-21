import { Link } from "expo-router";
import { Controller } from "react-hook-form";

import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, HStack, Text, useTheme, VStack } from "@/shared/ui";

import type { UseFormReturn } from "react-hook-form";

type SignUpFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

type SignUpFormProps = {
  form: UseFormReturn<SignUpFormValues>;
  onSubmit: () => void;
  isBusy: boolean;
};

export function SignUpForm({
  form,
  onSubmit,
  isBusy,
}: SignUpFormProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <VStack style={{ gap: theme.spacing.xl }}>
      <VStack style={{ gap: theme.spacing.sm }}>
        <Text weight="bold" style={{ fontSize: 30, lineHeight: 34 }}>
          {t("auth.signUp")}
        </Text>
        <Text muted>{t("auth.subtitle")}</Text>
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
          {t("auth.signUp")}
        </Button>

        <HStack gap={8} justify="center" align="center">
          <Text muted style={{ opacity: 0.9 }}>
            {t("auth.haveAccount")}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Text style={{ textDecorationLine: "underline" }}>
              {t("auth.goToSignIn")}
            </Text>
          </Link>
        </HStack>
      </VStack>
    </VStack>
  );
}
