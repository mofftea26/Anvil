import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { useTrainerDashboard } from "@/features/trainer/hooks/useTrainerDashboard";
import { StickyHeader, Text, VStack } from "@/shared/ui";

export default function TrainerDashboardScreen() {
  const { t, theme, refreshing, onRefresh } = useTrainerDashboard();

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
