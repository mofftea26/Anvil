import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable } from "react-native";
import { z } from "zod";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, Button, HStack, KeyboardScreen, Text, useTheme, VStack } from "@/shared/ui";

type Mode = "password" | "magic";

export default function SignInScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ error?: string }>();
  const redirectedError = typeof params.error === "string" ? params.error : null;

  const { isBusy, errorMessage, doSignInPassword, doSignInMagic, clearError } =
    useAuthActions();
  const [mode, setMode] = useState<Mode>("password");

  useEffect(() => {
    if (!redirectedError) return;
    appToast.error(redirectedError);
  }, [redirectedError]);

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
    appToast.success(t("auth.toasts.magicLinkSent"));
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
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
      <VStack style={{ gap: theme.spacing.xl }}>
        <VStack style={{ gap: theme.spacing.sm }}>
          <Text
            weight="bold"
            style={{ fontSize: 30, lineHeight: 34 }}
          >
            {t("auth.title")}
          </Text>
          <Text muted>{t("auth.subtitle")}</Text>
        </VStack>

        {redirectedError ? (
          <Text variant="caption" color={theme.colors.danger}>
            {redirectedError}
          </Text>
        ) : null}

        <HStack
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            padding: 6,
            gap: 6,
          }}
        >
          <Pressable
            onPress={() => switchMode("password")}
            style={{
              flex: 1,
              height: 44,
              borderRadius: theme.radii.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: mode === "password" ? theme.colors.surface2 : "transparent",
            }}
          >
            <Text weight="semibold">{t("auth.signIn")}</Text>
          </Pressable>

          <Pressable
            onPress={() => switchMode("magic")}
            style={{
              flex: 1,
              height: 44,
              borderRadius: theme.radii.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: mode === "magic" ? theme.colors.surface2 : "transparent",
            }}
          >
            <Text weight="semibold">{t("auth.magicLink")}</Text>
          </Pressable>
        </HStack>

        {mode === "password" ? (
          <VStack style={{ gap: theme.spacing.lg }}>
          <Controller
            control={passwordForm.control}
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
            <Text variant="caption" color={theme.colors.danger}>
              {errorMessage}
            </Text>
          ) : null}

          <Button isLoading={isBusy} onPress={onPasswordSubmit}>
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
      ) : (
        <VStack style={{ gap: theme.spacing.lg }}>
          <Text muted>
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
                  placeholder={t("common.placeholders.email")}
                keyboardType="email-address"
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

          <Button isLoading={isBusy} onPress={onMagicSubmit}>
            {t("auth.sendLink")}
          </Button>

          <VStack style={{ alignItems: "center", gap: 10, marginTop: 4 }}>
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
      )}
      </VStack>
    </KeyboardScreen>
  );
}
