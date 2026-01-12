import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Button, Text, YStack } from "tamagui";
import { z } from "zod";

import { updateMyUserRow } from "../../src/features/profile/api/profileApi";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppSelector } from "../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";

export default function OnboardingProfile() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);
  const me = useAppSelector((s) => s.profile.me);

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
    await updateMyUserRow(auth.userId, {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    });
    router.replace("/"); // role gate will route correctly
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
          {t("onboarding.profileTitle")}
        </Text>
        <Text opacity={0.75} lineHeight={22}>
          {t("onboarding.profileSubtitle")}
        </Text>
      </YStack>

      <YStack gap="$4">
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

        <Button
          backgroundColor="$accent"
          color="$background"
          borderRadius="$8"
          height={48}
          onPress={onSubmit}
        >
          {t("onboarding.save")}
        </Button>
      </YStack>
    </YStack>
  );
}
