import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import { Text, useTheme, VStack } from "../../../src/shared/ui";

export default function TrainerDashboard() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <VStack
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing.xxl,
        justifyContent: "center",
        gap: theme.spacing.sm,
      }}
    >
      <Text variant="title" weight="bold">
        {t("trainer.dashboardTitle")}
      </Text>
      <Text muted>{t("trainer.dashboardSubtitle")}</Text>
    </VStack>
  );
}
