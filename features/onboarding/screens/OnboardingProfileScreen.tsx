import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateMyUserRowMutation } from "../../src/features/profile/api/profileApiSlice";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppSelector } from "../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";
import { Button, KeyboardScreen, Text, useTheme, VStack } from "../../src/shared/ui";

export default function OnboardingProfile() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);
  const me = useAppSelector((s) => s.profile.me);
  const [updateMyUserRow] = useUpdateMyUserRowMutation();

  const schema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: me?.firstName ?? "",
      lastName: me?.lastName ?? "",
    },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!auth.userId) return;
    await updateMyUserRow({
      userId: auth.userId,
      payload: {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      },
    }).unwrap();
    router.replace("/"); // role gate will route correctly
  });

  return (
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
      <VStack style={{ gap: theme.spacing.xl }}>
        <VStack style={{ gap: theme.spacing.sm }}>
          <Text weight="bold" style={{ fontSize: 28, lineHeight: 32 }}>
            {t("onboarding.profileTitle")}
          </Text>
          <Text muted>{t("onboarding.profileSubtitle")}</Text>
        </VStack>

        <VStack style={{ gap: theme.spacing.lg }}>
        <Controller
          control={form.control}
          name="firstName"
          render={({ field: { value, onChange }, fieldState }) => (
            <AppInput
              label={t("auth.firstName")}
              value={value}
              onChangeText={onChange}
              placeholder="George"
              autoCapitalize="words"
              error={fieldState.error ? t("auth.errors.generic") : undefined}
            />
          )}
        />
        <Controller
          control={form.control}
          name="lastName"
          render={({ field: { value, onChange }, fieldState }) => (
            <AppInput
              label={t("auth.lastName")}
              value={value}
              onChangeText={onChange}
              placeholder="Maalouf"
              autoCapitalize="words"
              error={fieldState.error ? t("auth.errors.generic") : undefined}
            />
          )}
        />

        <Button onPress={onSubmit}>{t("onboarding.save")}</Button>
      </VStack>
      </VStack>
    </KeyboardScreen>
  );
}
