import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
    StickyHeader,
    TabBackgroundGradient,
    Text,
    useTheme,
} from "@/shared/ui";

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("client.dashboardTitle")}
        subtitle={t("client.dashboardSubtitle")}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
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
        {/* Header subtitle already shown above */}
      </ScrollView>
    </View>
  );
}
