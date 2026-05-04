import { router } from "expo-router";
import { View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

export function ClientCoachNotLinked() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card bordered background="surface2">
      <VStack style={{ gap: theme.spacing.md }}>
        <HStack align="center" gap={10}>
          <Icon name="user-group" size={18} color={theme.colors.textMuted} />
          <Text weight="bold">{t("linking.coach.title")}</Text>
        </HStack>
        <Text muted>{t("linking.coach.notLinked")}</Text>
        <HStack gap={theme.spacing.sm}>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" fullWidth onPress={() => router.push("/(client)/link-trainer")}>
              {t("linking.coach.linkNow")}
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button fullWidth onPress={() => router.push("/(client)/find-trainer")}>
              {t("linking.coach.findTrainer")}
            </Button>
          </View>
        </HStack>
      </VStack>
    </Card>
  );
}
