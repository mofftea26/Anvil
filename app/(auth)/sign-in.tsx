import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button, Text, XStack, YStack } from "tamagui";
import { z } from "zod";

import { useAuthActions } from "../../src/features/auth/hooks/useAuthActions";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";

type Mode = "password" | "magic";

export default function SignInScreen() {
  const { t } = useAppTranslation();
  const { isBusy, errorMessage, doSignInPassword, doSignInMagic, clearError } =
    useAuthActions();
  const [mode, setMode] = useState<Mode>("password");

  const emailSchema = useMemo(
    () => z.string().email(t("auth.errors.invalidEmail")),
    [t]
  );

  const passwordSchema = useMemo(
    () =>
      z.object({
        email: emailSchema,
        password: z.string().min(8, t("auth.errors.passwordMin")),
      }),
    [emailSchema, t]
  );

  const magicSchema = useMemo(
    () =>
      z.object({
        email: emailSchema,
      }),
    [emailSchema]
  );

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const magicForm = useForm<z.infer<typeof magicSchema>>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onPasswordSubmit = passwordForm.handleSubmit(async (values) => {
    await doSignInPassword(values.email.trim(), values.password);
    router.replace("/");
  });

  const onMagicSubmit = magicForm.handleSubmit(async (values) => {
    await doSignInMagic(values.email.trim());
    router.push({
      pathname: "/(auth)/forgot-password",
      params: { mode: "magic" },
    });
  });

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    clearError();
    setMode(next);
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      justifyContent="center"
      gap="$5"
      padding="$6"
    >
      <YStack gap="$2">
        <Text fontSize={30} fontWeight="700">
          {t("auth.title")}
        </Text>
        <Text opacity={0.75} lineHeight={22}>
          {t("auth.subtitle")}
        </Text>
      </YStack>

      <XStack
        backgroundColor="$surface"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$8"
        padding="$1"
        gap="$1"
      >
        <Button
          flex={1}
          borderRadius="$7"
          backgroundColor={mode === "password" ? "$surface2" : "transparent"}
          onPress={() => switchMode("password")}
        >
          {t("auth.signIn")}
        </Button>

        <Button
          flex={1}
          borderRadius="$7"
          backgroundColor={mode === "magic" ? "$surface2" : "transparent"}
          onPress={() => switchMode("magic")}
        >
          {t("auth.magicLink")}
        </Button>
      </XStack>

      {mode === "password" ? (
        <YStack gap="$4">
          <Controller
            control={passwordForm.control}
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
            control={passwordForm.control}
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

          {errorMessage ? (
            <Text color="$accent2" fontSize={13}>
              {errorMessage}
            </Text>
          ) : null}

          <Button
            backgroundColor="$accent"
            color="$background"
            borderRadius="$8"
            height={48}
            disabled={isBusy}
            onPress={onPasswordSubmit}
          >
            {isBusy ? t("common.loading") : t("auth.signIn")}
          </Button>

          <YStack alignItems="center" gap="$2" marginTop="$1">
            <Link href="/(auth)/forgot-password" asChild>
              <Text opacity={0.85} textDecorationLine="underline">
                {t("auth.forgotPassword")}
              </Text>
            </Link>

            <XStack gap="$2" alignItems="center">
              <Text opacity={0.75}>{t("auth.noAccount")}</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Text textDecorationLine="underline">
                  {t("auth.goToSignUp")}
                </Text>
              </Link>
            </XStack>
          </YStack>
        </YStack>
      ) : (
        <YStack gap="$4">
          <Text opacity={0.75} lineHeight={22}>
            {t("auth.magicHint")}
          </Text>

          <Controller
            control={magicForm.control}
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

          {errorMessage ? (
            <Text color="$accent2" fontSize={13}>
              {errorMessage}
            </Text>
          ) : null}

          <Button
            backgroundColor="$accent"
            color="$background"
            borderRadius="$8"
            height={48}
            disabled={isBusy}
            onPress={onMagicSubmit}
          >
            {isBusy ? t("common.loading") : t("auth.sendLink")}
          </Button>

          <YStack alignItems="center" gap="$2" marginTop="$1">
            <XStack gap="$2" alignItems="center">
              <Text opacity={0.75}>{t("auth.noAccount")}</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Text textDecorationLine="underline">
                  {t("auth.goToSignUp")}
                </Text>
              </Link>
            </XStack>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}
