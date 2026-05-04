import { router } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TrainerClientRow } from "@/features/clients/components/trainer-clients/TrainerClientCard";
import { useTrainerClientsAssignmentsSummary } from "@/features/clients/hooks/assignments/useTrainerClientsAssignmentsSummary";
import { useTrainerClients } from "@/features/clients/hooks/trainer-clients/useTrainerClients";
import { TrainerRosterAvatarChip } from "@/features/dashboard/components/TrainerRosterAvatarChip";
import { buildTrainerTodaysRosterRows } from "@/features/dashboard/utils/buildTrainerTodaysRosterRows";
import { hexToRgba } from "@/features/linking/utils/coachFormatting";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Icon,
  LoadingSpinner,
  StickyHeader,
  Text,
  getScreenHorizontalPadding,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function TrainerTodaysRosterScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const screenPadding = getScreenHorizontalPadding(theme);

  const profile = useMyProfile();
  const [summaryRefreshToken, setSummaryRefreshToken] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const { data, onRefresh, trainerId, isLoading } = useTrainerClients();

  const rows = (data as TrainerClientRow[] | undefined) ?? [];
  const activeRows = React.useMemo(
    () => rows.filter((row) => row.status !== "archived"),
    [rows]
  );
  const activeClientIds = React.useMemo(
    () => activeRows.map((row) => row.clientId),
    [activeRows]
  );

  const summary = useTrainerClientsAssignmentsSummary({
    trainerId,
    clientIds: activeClientIds,
    refreshToken: summaryRefreshToken,
  });

  const todayCount = React.useMemo(
    () =>
      activeRows.filter((row) =>
        Boolean(summary.todayWorkoutByClientId[row.clientId])
      ).length,
    [activeRows, summary.todayWorkoutByClientId]
  );

  const rosterRows = React.useMemo(
    () =>
      buildTrainerTodaysRosterRows({
        activeRows,
        todayWorkoutByClientId: summary.todayWorkoutByClientId,
        workoutTitleById: summary.workoutTitleById,
        todayYmd: summary.todayYmd,
        unnamedClientLabel: t("trainer.dashboard.unnamedClient"),
      }),
    [
      activeRows,
      summary.todayWorkoutByClientId,
      summary.workoutTitleById,
      summary.todayYmd,
      t,
    ]
  );

  const handleRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([onRefresh(), profile.refetch()]);
      setSummaryRefreshToken((x) => x + 1);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, profile]);

  const noProgramCount = React.useMemo(
    () =>
      activeRows.filter(
        (row) => !summary.activeProgramsByClientId[row.clientId]
      ).length,
    [activeRows, summary.activeProgramsByClientId]
  );

  const subtitleText = t("trainer.todaysRoster.subtitle", "{{n}} training today", {
    n: String(todayCount),
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("trainer.todaysRoster.title", "Today's roster")}
        subtitle={subtitleText}
        showBackButton
        rightButton={{
          onPress: () => void handleRefresh(),
          variant: "icon",
          isLoading: refreshing,
          icon: <Icon name="refresh" size={20} color={theme.colors.text} />,
        }}
      />
      {isLoading && !rows.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <LoadingSpinner />
        </View>
      ) : rosterRows.length === 0 ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: screenPadding,
            paddingTop: 32,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
          }
        >
          <VStack style={{ alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                backgroundColor: hexToRgba(theme.colors.textMuted, 0.12),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="people-outline" size={24} color={theme.colors.textMuted} />
            </View>
            <Text muted style={{ textAlign: "center" }}>
              {noProgramCount > 0
                ? t("trainer.dashboard.focusNoProgram", "{{n}} clients need a program", {
                    n: String(noProgramCount),
                  })
                : activeRows.length === 0
                  ? t("trainer.dashboard.emptyNoClients")
                  : t("trainer.dashboard.allRest")}
            </Text>
          </VStack>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{
              paddingHorizontal: screenPadding,
              gap: 12,
              paddingBottom: 8,
            }}
          >
            {rosterRows.map((row) => (
              <TrainerRosterAvatarChip
                key={row.clientId}
                name={row.name}
                avatarUrl={row.avatarUrl}
                seed={row.seed}
                initials={row.initials}
                onPress={() =>
                  router.push(
                    `/(trainer)/client/${row.clientId}` as Parameters<typeof router.push>[0]
                  )
                }
              />
            ))}
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}
