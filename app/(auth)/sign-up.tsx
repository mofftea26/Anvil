import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthActions } from "../../src/features/auth/hooks/useAuthActions";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";
import { Button, HStack, KeyboardScreen, Text, useTheme, VStack } from "../../src/shared/ui";

export default function SignUpScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const { isBusy, errorMessage, doSignUp } = useAuthActions();

  const schema = z
    .object({
      email: z.string().email(t("auth.errors.invalidEmail")),
      password: z.string().min(8, t("auth.errors.passwordMin")),
      confirmPassword: z.string().min(8, t("auth.errors.passwordMin")),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t("auth.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await doSignUp(values.email.trim(), values.password);
    // Depending on Supabase settings, user may need email confirmation.
    // Either way, show "check email" style page.
    router.replace({
      pathname: "../forgot-password",
      params: { mode: "signup" },
    });
  });

  return (
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
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
              placeholder="name@email.com"
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

        {errorMessage ? (
          <Text variant="caption" color={theme.colors.danger}>
            {errorMessage}
          </Text>
        ) : null}

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
    </KeyboardScreen>
  );
}
