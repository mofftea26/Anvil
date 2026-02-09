import { router } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import {
  TrainerClientCard,
  type TrainerClientRow,
} from "@/features/clients/components/trainer-clients/TrainerClientCard";
import { useTrainerClientsAssignmentsSummary } from "@/features/clients/hooks/assignments/useTrainerClientsAssignmentsSummary";
import { useTrainerClients } from "@/features/clients/hooks/trainer-clients/useTrainerClients";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  Icon,
  LoadingSpinner,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function TrainerClientsScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const [assignmentsRefreshToken, setAssignmentsRefreshToken] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      // Ensure assignment badges/buttons update after edits done on other screens (e.g. client details).
      setAssignmentsRefreshToken((x) => x + 1);
    }, [])
  );

  const {
    data,
    isLoading,
    error,
    refreshing,
    onRefresh,
    onArchive,
    archiveLoading,
    trainerId,
  } = useTrainerClients();

  const clientIds = React.useMemo(
    () => (data as TrainerClientRow[] | undefined)?.map((r) => r.clientId) ?? [],
    [data]
  );
  const summary = useTrainerClientsAssignmentsSummary({
    trainerId,
    clientIds,
    refreshToken: assignmentsRefreshToken,
  });

  const handleView = (clientId: string) => {
    router.push(`/(trainer)/client/${clientId}` as Parameters<typeof router.push>[0]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("linking.clients.title")}
        subtitle={t("linking.clients.subtitle")}
        rightButton={{
          onPress: () => router.push("/(trainer)/add-client" as Parameters<typeof router.push>[0]),
          variant: "icon",
          icon: (
            <Icon
              name="add-circle-outline"
              size={22}
              color={theme.colors.text}
              strokeWidth={1.5}
            />
          ),
        }}
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.sm,
          paddingBottom: theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Text color={theme.colors.danger}>
            {(error as { message?: string })?.message ?? t("auth.errors.generic")}
          </Text>
        ) : null}

        {isLoading ? (
          <LoadingSpinner />
        ) : !data?.length ? (
          <Card>
            <VStack style={{ gap: theme.spacing.sm }}>
              <Text weight="bold">{t("linking.clients.empty")}</Text>
              <Button
                onPress={() =>
                  router.push("/(trainer)/add-client" as Parameters<typeof router.push>[0])
                }
              >
                {t("linking.clients.addClient")}
              </Button>
            </VStack>
          </Card>
        ) : (
          <VStack style={{ gap: theme.spacing.md }}>
            {(data as TrainerClientRow[]).map((row) => (
              <TrainerClientCard
                key={row.id}
                row={row}
                onPressView={handleView}
                onPressArchive={onArchive}
                archiveLoading={archiveLoading}
                onAssigned={() => setAssignmentsRefreshToken((x) => x + 1)}
                assignmentSummary={{
                  activeProgram: summary.activeProgramsByClientId[row.clientId] ?? null,
                  todayWorkout: summary.todayWorkoutByClientId[row.clientId] ?? null,
                  programTitle:
                    summary.programTitleById[
                      summary.activeProgramsByClientId[row.clientId]?.programtemplateid ?? ""
                    ] ?? null,
                  workoutTitle:
                    summary.workoutTitleById[
                      summary.todayWorkoutByClientId[row.clientId]?.workoutTemplateId ?? ""
                    ] ?? null,
                }}
              />
            ))}
          </VStack>
        )}
      </ScrollView>
    </View>
  );
}
