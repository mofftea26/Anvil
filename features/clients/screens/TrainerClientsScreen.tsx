import { router } from "expo-router";
import React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
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
  HStack,
  Icon,
  LoadingSpinner,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  getScreenHorizontalPadding,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function TrainerClientsScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const screenPadding = getScreenHorizontalPadding(theme);

  const [assignmentsRefreshToken, setAssignmentsRefreshToken] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "archived">("all");

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

  const totalCount = data?.length ?? 0;
  const activeCount = (data as TrainerClientRow[] | undefined)?.filter((row) => row.status !== "archived").length ?? 0;
  const archivedCount = Math.max(0, totalCount - activeCount);
  const filteredRows = React.useMemo(() => {
    const rows = (data as TrainerClientRow[] | undefined) ?? [];
    const sortActiveFirst = (items: TrainerClientRow[]) =>
      [...items].sort((a, b) => {
        const aIsArchived = a.status === "archived";
        const bIsArchived = b.status === "archived";
        if (aIsArchived === bIsArchived) return 0;
        return aIsArchived ? 1 : -1;
      });
    if (statusFilter === "all") return sortActiveFirst(rows);
    if (statusFilter === "active") return sortActiveFirst(rows.filter((row) => row.status !== "archived"));
    return sortActiveFirst(rows.filter((row) => row.status === "archived"));
  }, [data, statusFilter]);

  const filterPills = [
    { key: "all" as const, label: t("common.all", "All"), count: totalCount },
    { key: "active" as const, label: t("linking.management.status.active"), count: activeCount },
    { key: "archived" as const, label: t("linking.clients.archived"), count: archivedCount },
  ];

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
        alwaysBounceVertical
        bounces
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: screenPadding,
          paddingBottom: theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Card bordered background="surface2">
            <Text color={theme.colors.danger}>
              {(error as { message?: string })?.message ?? t("auth.errors.generic")}
            </Text>
          </Card>
        ) : null}

        <HStack gap={theme.spacing.sm}>
          {filterPills.map((pill) => {
            const isActive = statusFilter === pill.key;
            return (
              <Pressable
                key={pill.key}
                onPress={() => setStatusFilter(pill.key)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 40,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: isActive ? theme.colors.accent : theme.colors.border,
                  backgroundColor: isActive ? theme.colors.surface : theme.colors.surface2,
                  opacity: pressed ? 0.86 : 1,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: 8,
                  justifyContent: "center",
                })}
              >
                <HStack align="center" justify="center" gap={6}>
                  <Text
                    variant="caption"
                    weight={isActive ? "bold" : "semibold"}
                    style={{ color: isActive ? theme.colors.text : theme.colors.textMuted }}
                    numberOfLines={1}
                  >
                    {pill.label}
                  </Text>
                  <Text
                    variant="caption"
                    weight="bold"
                    style={{ color: isActive ? theme.colors.accent : theme.colors.text }}
                  >
                    {pill.count}
                  </Text>
                </HStack>
              </Pressable>
            );
          })}
        </HStack>

        {isLoading ? (
          <LoadingSpinner />
        ) : !filteredRows.length ? (
          <Card bordered background="surface2">
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
            {filteredRows.map((row) => (
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
