import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Button, Text, YStack } from "tamagui";
import { z } from "zod";

import { useAuthActions } from "../../src/features/auth/hooks/useAuthActions";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";

export default function ResetPasswordScreen() {
  const { t } = useAppTranslation();
  const { isBusy, errorMessage, doUpdatePassword } = useAuthActions();

  const schema = z
    .object({
      newPassword: z.string().min(8, t("auth.errors.passwordMin")),
      confirmPassword: z.string().min(8, t("auth.errors.passwordMin")),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: t("auth.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await doUpdatePassword(values.newPassword);
    router.replace("/"); // role gate
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
        <Text fontSize={28} fontWeight="700">
          {t("auth.resetPassword")}
        </Text>
        <Text opacity={0.75} lineHeight={22}>
          {t("auth.saveNewPassword")}
        </Text>
      </YStack>

      <YStack gap="$4">
        <Controller
          control={form.control}
          name="newPassword"
          render={({ field: { value, onChange }, fieldState }) => (
            <AppInput
              label={t("auth.newPassword")}
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
          {isBusy ? t("common.loading") : t("auth.saveNewPassword")}
        </Button>
      </YStack>
    </YStack>
  );
}
