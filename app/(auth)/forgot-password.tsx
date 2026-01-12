import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Button, Text, YStack } from "tamagui";
import { z } from "zod";

import { useAuthActions } from "../../src/features/auth/hooks/useAuthActions";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";

export default function ForgotPasswordScreen() {
  const { t } = useAppTranslation();
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
  });

  // If we came here from magic link / signup submission, show a simple "check email" message.
  if (mode === "magic" || mode === "signup") {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        gap="$3"
      >
        <Text fontSize={26} fontWeight="700">
          {t("auth.checkEmailTitle")}
        </Text>
        <Text opacity={0.75} lineHeight={22}>
          {t("auth.checkEmailSubtitle")}
        </Text>

        <Link href="/(auth)/sign-in" asChild>
          <Button
            marginTop="$4"
            backgroundColor="$surface"
            borderColor="$borderColor"
            borderWidth={1}
          >
            {t("auth.goToSignIn")}
          </Button>
        </Link>
      </YStack>
    );
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
        <Text fontSize={28} fontWeight="700">
          {t("auth.resetPassword")}
        </Text>
        <Text opacity={0.75} lineHeight={22}>
          {t("auth.resetHint")}
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
          {isBusy ? t("common.loading") : t("auth.sendLink")}
        </Button>

        <Link href="/(auth)/sign-in" asChild>
          <Text opacity={0.8} textAlign="center" textDecorationLine="underline">
            {t("common.back")}
          </Text>
        </Link>
      </YStack>
    </YStack>
  );
}
