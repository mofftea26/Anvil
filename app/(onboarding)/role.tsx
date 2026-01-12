import { router } from "expo-router";
import { Button, Card, Text, YStack } from "tamagui";

import { updateMyUserRow } from "../../src/features/profile/api/profileApi";
import { useAppSelector } from "../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";

export default function OnboardingRole() {
  const { t } = useAppTranslation();
  const auth = useAppSelector((s) => s.auth);

  const setRole = async (role: "trainer" | "client") => {
    if (!auth.userId) return;

    await updateMyUserRow(auth.userId, {
      role,
      roleConfirmed: true,
    });

    router.replace("/"); // role gate
  };

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
          {t("onboarding.roleTitle")}
        </Text>
        <Text opacity={0.75} lineHeight={22}>
          {t("onboarding.roleSubtitle")}
        </Text>
      </YStack>

      <Card
        bordered
        backgroundColor="$surface"
        borderColor="$borderColor"
        padding="$5"
        borderRadius="$10"
        onPress={() => void setRole("trainer")}
      >
        <YStack gap="$2">
          <Text fontSize={18} fontWeight="700">
            {t("onboarding.trainer")}
          </Text>
          <Text opacity={0.75} lineHeight={20}>
            {t("onboarding.roleHintTrainer")}
          </Text>
          <Button
            marginTop="$3"
            backgroundColor="$accent"
            color="$background"
            borderRadius="$8"
            height={44}
          >
            {t("onboarding.trainer")}
          </Button>
        </YStack>
      </Card>

      <Card
        bordered
        backgroundColor="$surface"
        borderColor="$borderColor"
        padding="$5"
        borderRadius="$10"
        onPress={() => void setRole("client")}
      >
        <YStack gap="$2">
          <Text fontSize={18} fontWeight="700">
            {t("onboarding.client")}
          </Text>
          <Text opacity={0.75} lineHeight={20}>
            {t("onboarding.roleHintClient")}
          </Text>
          <Button
            marginTop="$3"
            backgroundColor="$surface2"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius="$8"
            height={44}
          >
            {t("onboarding.client")}
          </Button>
        </YStack>
      </Card>
    </YStack>
  );
}
