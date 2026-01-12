import { Text, YStack } from "tamagui";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";

export default function ClientDashboard() {
  const { t } = useAppTranslation();

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      padding="$6"
      paddingBottom="$10"
      justifyContent="center"
    >
      <Text fontSize={22} fontWeight="700">
        {t("client.dashboardTitle")}
      </Text>
      <Text opacity={0.75} marginTop="$2">
        {t("client.dashboardSubtitle")}
      </Text>
    </YStack>
  );
}
