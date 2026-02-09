import React from "react";
import { ScrollView, StyleSheet } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Icon, Text, useTheme, VStack } from "@/shared/ui";

export function ClientStatsScreen(props: { clientId: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
        gap: 12,
      }}
    >
      <Card background="surface2" style={styles.card}>
        <VStack style={{ gap: 10, alignItems: "center" }}>
          <Icon name="analytics-outline" size={28} color={theme.colors.textMuted} />
          <Text weight="bold" style={{ fontSize: 16, textAlign: "center" }}>
            {t("client.workouts.statsComingSoonTitle", "Stats coming soon")}
          </Text>
          <Text style={{ color: theme.colors.textMuted, textAlign: "center", lineHeight: 20 }}>
            {t(
              "client.workouts.statsComingSoonSubtitle",
              "We’re adding analytics once workout sessions and history are available."
            )}
          </Text>
        </VStack>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16 },
});

