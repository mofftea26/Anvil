import { router } from "expo-router";
import React from "react";

import { useGetMyCoachQuery } from "../../../src/features/linking/api/linkingApiSlice";
import { useAppSelector } from "../../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import { Button, Card, HStack, Text, useTheme, VStack } from "../../../src/shared/ui";

export default function ClientDashboard() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);

  const clientId = auth.userId ?? "";
  const { data: coach, isLoading } = useGetMyCoachQuery(
    { clientId },
    { skip: !clientId }
  );

  return (
    <VStack
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing.xxl,
        gap: theme.spacing.lg,
      }}
    >
      <Text variant="title" weight="bold">
        {t("client.dashboardTitle")}
      </Text>
      <Text muted>{t("client.dashboardSubtitle")}</Text>

      <Card>
        <VStack style={{ gap: theme.spacing.sm }}>
          <Text weight="bold">{t("linking.coach.title")}</Text>

          {isLoading ? (
            <Text muted>{t("common.loading")}</Text>
          ) : coach ? (
            <VStack style={{ gap: 8 }}>
              <Text weight="bold">
                {coach.trainer?.firstName || coach.trainer?.lastName
                  ? `${coach.trainer?.firstName ?? ""} ${coach.trainer?.lastName ?? ""}`.trim()
                  : coach.trainer?.email ?? "—"}
              </Text>
              {coach.trainerProfile?.brandName ? (
                <Text muted>{coach.trainerProfile.brandName}</Text>
              ) : null}
              {coach.trainerProfile?.bio ? (
                <Text muted numberOfLines={3}>
                  {coach.trainerProfile.bio}
                </Text>
              ) : null}
            </VStack>
          ) : (
            <Text muted>{t("linking.coach.notLinked")}</Text>
          )}

          {!coach ? (
            <Button onPress={() => router.push("/(client)/link-trainer")}>
              {t("linking.coach.linkNow")}
            </Button>
          ) : (
            <HStack gap={10}>
              <Button
                variant="secondary"
                fullWidth
                style={{ flex: 1 }}
                onPress={() => router.push("/(client)/(tabs)/profile")}
              >
                {t("tabs.profile")}
              </Button>
            </HStack>
          )}
        </VStack>
      </Card>
    </VStack>
  );
}
