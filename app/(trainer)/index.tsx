import { Button, Text, YStack } from "tamagui";
import { useAuthActions } from "../../src/features/auth/hooks/useAuthActions";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";

export default function TrainerHome() {
  const { t } = useAppTranslation();
  const { isBusy, doSignOut } = useAuthActions();

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      padding="$6"
      justifyContent="center"
      gap="$4"
    >
      <Text fontSize={24} fontWeight="700">
        {t("trainer.homeTitle")}
      </Text>
      <Text opacity={0.75} lineHeight={22}>
        {t("trainer.homeSubtitle")}
      </Text>

      <Button
        marginTop="$4"
        backgroundColor="$surface"
        borderColor="$borderColor"
        borderWidth={1}
        disabled={isBusy}
        onPress={() => void doSignOut()}
      >
        {isBusy ? t("common.loading") : t("auth.signOut")}
      </Button>
    </YStack>
  );
}
