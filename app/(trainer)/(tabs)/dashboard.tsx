import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import React from "react";
import { RefreshControl, ScrollView } from "react-native";
import { Text, useTheme, VStack } from "../../../src/shared/ui";

export default function TrainerDashboard() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        justifyContent: "center",
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={theme.colors.text}
        />
      }
    >
      <VStack style={{ gap: theme.spacing.sm }}>
        <Text variant="title" weight="bold">
          {t("trainer.dashboardTitle")}
        </Text>
        <Text muted>{t("trainer.dashboardSubtitle")}</Text>
      </VStack>
    </ScrollView>
  );
}
