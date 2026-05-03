import React from "react";
import { Animated, View } from "react-native";

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
  const transition = React.useRef(new Animated.Value(1)).current;

  const changeTab = React.useCallback(
    (next: WorkoutsTopTabKey) => {
      if (next === tab) return;
      Animated.timing(transition, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setTab(next);
        Animated.timing(transition, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    },
    [tab, transition]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("client.workouts.title", "Workouts")}
        subtitle={t("client.workouts.subtitle", "My Program • Schedule • History • Stats")}
      />

      <WorkoutsTopTabs active={tab} onChange={changeTab} showStats />

      <Animated.View
        style={{
          flex: 1,
          opacity: transition,
          transform: [
            {
              translateY: transition.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        }}
      >
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
      </Animated.View>
    </View>
  );
}

