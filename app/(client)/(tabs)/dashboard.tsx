import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { useMyProfile } from "../../../src/features/profile/hooks/useMyProfile";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import {
    StickyHeader,
    Text,
    useStickyHeaderHeight,
    useTheme,
} from "../../../src/shared/ui";

export default function ClientDashboard() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const headerHeight = useStickyHeaderHeight();
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader title={t("client.dashboardTitle")} />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          paddingTop: theme.spacing.xl,
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
        <Text muted>{t("client.dashboardSubtitle")}</Text>
      </ScrollView>
    </View>
  );
}
