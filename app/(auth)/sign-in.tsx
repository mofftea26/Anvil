import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Button, Tabs, Text, XStack, YStack } from "tamagui";
import { z } from "zod";

import { useAuthActions } from "../../src/features/auth/hooks/useAuthActions";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";

export default function SignInScreen() {
  const { t } = useAppTranslation();
  const { isBusy, errorMessage, doSignInPassword, doSignInMagic } =
    useAuthActions();

  const emailSchema = z.string().email(t("auth.errors.invalidEmail"));

  const passwordSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, t("auth.errors.passwordMin")),
  });

  const magicSchema = z.object({
    email: emailSchema,
  });

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
    // session listener + role gate will redirect automatically
    router.replace("/");
  });

  const onMagicSubmit = magicForm.handleSubmit(async (values) => {
    await doSignInMagic(values.email.trim());
    // We show a "check email" state
    router.push({
      pathname: "../forgot-password",
      params: { mode: "magic" },
    });
  });

  if (errorMessage) {
    // keep screen; we’ll show inline error banner below
  }

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
          {t("auth.title")}
        </Text>
        <Text opacity={0.75} lineHeight={22}>
          {t("auth.subtitle")}
        </Text>
      </YStack>

      <Tabs defaultValue="password" orientation="horizontal">
        <Tabs.Content value="password" marginTop="$4">
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
              onPress={onPasswordSubmit}
            >
              {isBusy ? t("common.loading") : t("auth.signIn")}
            </Button>

            <XStack justifyContent="space-between" alignItems="center">
              <Link href="../forgot-password" asChild>
                <Text opacity={0.8} textDecorationLine="underline">
                  {t("auth.forgotPassword")}
                </Text>
              </Link>

              <XStack gap="$2">
                <Text opacity={0.8}>{t("auth.noAccount")}</Text>
                <Link href="../sign-up" asChild>
                  <Text textDecorationLine="underline">
                    {t("auth.goToSignUp")}
                  </Text>
                </Link>
              </XStack>
            </XStack>
          </YStack>
        </Tabs.Content>

        <Tabs.Content value="magic" marginTop="$4">
          <YStack gap="$4">
            <Text opacity={0.75}>{t("auth.magicHint")}</Text>

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
              borderRadius="$6"
              height={48}
              disabled={isBusy}
              onPress={onMagicSubmit}
            >
              {isBusy ? t("common.loading") : t("auth.sendLink")}
            </Button>

            <XStack gap="$2" justifyContent="center">
              <Text opacity={0.8}>{t("auth.noAccount")}</Text>
              <Link href="../sign-up" asChild>
                <Text textDecorationLine="underline">
                  {t("auth.goToSignUp")}
                </Text>
              </Link>
            </XStack>
          </YStack>
        </Tabs.Content>
      </Tabs>
    </YStack>
  );
}
