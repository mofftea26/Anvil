import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, Button, KeyboardScreen, Text, useTheme, VStack } from "@/shared/ui";

export default function ForgotPasswordScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode;

  const { isBusy, errorMessage, doForgotPassword } = useAuthActions();

  const schema = z.object({
    email: z.string().email(t("auth.errors.invalidEmail")),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await doForgotPassword(values.email.trim());
    appToast.success(t("auth.toasts.resetLinkSent"));
  });

  // If we came here from magic link / signup submission, show a simple "check email" message.
  if (mode === "magic" || mode === "signup") {
    return (
      <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
        <VStack style={{ gap: theme.spacing.md }}>
          <Text weight="bold" style={{ fontSize: 26, lineHeight: 30 }}>
            {t("auth.checkEmailTitle")}
          </Text>
          <Text muted>{t("auth.checkEmailSubtitle")}</Text>

          <Link href="/(auth)/sign-in" asChild>
            <Button variant="secondary" style={{ marginTop: theme.spacing.lg }}>
              {t("auth.goToSignIn")}
            </Button>
          </Link>
        </VStack>
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
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
              placeholder="name@email.com"
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
    </KeyboardScreen>
  );
}
