import React from "react";
import { RefreshControl, ScrollView } from "react-native";

import { useMyProfile } from "../../../src/features/profile/hooks/useMyProfile";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import { Text, useTheme } from "../../../src/shared/ui";

export default function ClientDashboard() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  // Dashboard stays lightweight; "My Coach" lives in its dedicated tab.
  const { refetch } = useMyProfile();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        gap: theme.spacing.lg,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={theme.colors.text}
        />
      }
    >
      <Text variant="title" weight="bold">
        {t("client.dashboardTitle")}
      </Text>
      <Text muted>{t("client.dashboardSubtitle")}</Text>
    </ScrollView>
  );
}
