import { router } from "expo-router";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, Text, useTheme, VStack } from "@/shared/ui";

export function ClientCoachNotLinked() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card>
      <VStack style={{ gap: theme.spacing.sm }}>
        <Text muted>{t("linking.coach.notLinked")}</Text>
        <Button onPress={() => router.push("/(client)/find-trainer")}>
          {t("linking.coach.findTrainer")}
        </Button>
      </VStack>
    </Card>
  );
}
