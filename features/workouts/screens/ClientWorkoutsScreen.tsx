import React from "react";
import { View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import {
  StickyHeader,
  TabBackgroundGradient,
  Text,
  useTheme,
} from "@/shared/ui";

import { WorkoutsTopTabs, type WorkoutsTopTabKey } from "../components/WorkoutsTopTabs";
import { ClientScheduleScreen } from "./ClientScheduleScreen";
import { WorkoutHistoryScreen } from "./WorkoutHistoryScreen";
import { ClientStatsScreen } from "./ClientStatsScreen";
import { ClientMyProgramScreen } from "./ClientMyProgramScreen";

export function ClientWorkoutsScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const userId = useAppSelector((s) => s.auth.userId);

  const [tab, setTab] = React.useState<WorkoutsTopTabKey>("program");

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("client.workouts.title", "Workouts")}
        subtitle={t("client.workouts.subtitle", "Schedule • Run • History")}
      />

      <WorkoutsTopTabs active={tab} onChange={setTab} showStats />

      {!userId ? (
        <View style={{ padding: theme.spacing.xl }}>
          <Text style={{ color: theme.colors.textMuted }}>
            {t("auth.notAuthenticated", "Not authenticated")}
          </Text>
        </View>
      ) : tab === "program" ? (
        <ClientMyProgramScreen />
      ) : tab === "schedule" ? (
        <ClientScheduleScreen clientId={userId} />
      ) : tab === "history" ? (
        <WorkoutHistoryScreen clientId={userId} />
      ) : (
        <ClientStatsScreen clientId={userId} />
      )}
    </View>
  );
}

