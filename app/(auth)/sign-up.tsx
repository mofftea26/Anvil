import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Button, Text, XStack, YStack } from "tamagui";
import { z } from "zod";

import { useAuthActions } from "../../src/features/auth/hooks/useAuthActions";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";

export default function SignUpScreen() {
  const { t } = useAppTranslation();
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
    <YStack
      flex={1}
      backgroundColor="$background"
      padding="$6"
      justifyContent="center"
      gap="$5"
    >
      <YStack gap="$2">
        <Text fontSize={30} fontWeight="700">
          {t("auth.signUp")}
        </Text>
        <Text opacity={0.75} lineHeight={22}>
          {t("auth.subtitle")}
        </Text>
      </YStack>

      <YStack gap="$4">
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
              secureTextEntry
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
              secureTextEntry
              autoCapitalize="none"
              error={fieldState.error?.message}
            />
          )}
        />

        {errorMessage ? (
          <Text color="$accent2" fontSize={13}>
            {errorMessage}
          </Text>
        ) : null}

        <Button
          backgroundColor="$accent"
          color="$background"
          borderRadius="$6"
          height={48}
          disabled={isBusy}
          onPress={onSubmit}
        >
          {isBusy ? t("common.loading") : t("auth.signUp")}
        </Button>

        <XStack gap="$2" justifyContent="center">
          <Text opacity={0.8}>{t("auth.haveAccount")}</Text>
          <Link href="/(auth)/sign-in" asChild>
            <Text textDecorationLine="underline">{t("auth.goToSignIn")}</Text>
          </Link>
        </XStack>
      </YStack>
    </YStack>
  );
}
