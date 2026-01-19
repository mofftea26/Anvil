import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
    StickyHeader,
    TabBackgroundGradient,
    Text,
    useTheme,
    VStack,
} from "@/shared/ui";

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("trainer.dashboardTitle")}
        subtitle={t("trainer.dashboardSubtitle")}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.xl,
          paddingTop: theme.spacing.xl,
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
        <VStack style={{ gap: theme.spacing.sm }} />
      </ScrollView>
    </View>
  );
}
