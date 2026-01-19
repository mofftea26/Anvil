import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import {
    StickyHeader,
    Text,
    useStickyHeaderHeight,
    useTheme,
    VStack,
} from "../../../src/shared/ui";

export default function TrainerDashboard() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const headerHeight = useStickyHeaderHeight();
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
      <StickyHeader title={t("trainer.dashboardTitle")} />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
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
        <VStack style={{ gap: theme.spacing.sm }}>
          <Text muted>{t("trainer.dashboardSubtitle")}</Text>
        </VStack>
      </ScrollView>
    </View>
  );
}
