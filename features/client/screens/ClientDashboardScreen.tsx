import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { useClientDashboard } from "@/features/client/hooks/useClientDashboard";
import { StickyHeader, Text } from "@/shared/ui";

export default function ClientDashboardScreen() {
  const { t, theme, refreshing, onRefresh } = useClientDashboard();

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
