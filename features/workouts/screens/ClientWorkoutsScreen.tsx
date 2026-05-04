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

const VALID_TABS: ReadonlySet<WorkoutsTopTabKey> = new Set([
  "program",
  "schedule",
  "history",
  "stats",
]);

function normalizeInitialTab(value?: string | null): WorkoutsTopTabKey {
  if (value && VALID_TABS.has(value as WorkoutsTopTabKey)) {
    return value as WorkoutsTopTabKey;
  }
  return "program";
}

export type ClientWorkoutsScreenProps = {
  /**
   * Optional initial tab. Used by the route shell to honor a `?tab=` query
   * param (e.g. dashboard "Schedule" pill deep-links to `?tab=schedule`).
   * Unknown values fall back to `program`.
   */
  initialTab?: WorkoutsTopTabKey | string | null;
};

export function ClientWorkoutsScreen(props: ClientWorkoutsScreenProps = {}) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const userId = useAppSelector((s) => s.auth.userId);

  const [tab, setTab] = React.useState<WorkoutsTopTabKey>(() =>
    normalizeInitialTab(props.initialTab)
  );
  const transition = React.useRef(new Animated.Value(1)).current;

  // Keep the active tab in sync when the route shell pushes a new `?tab=` param
  // (e.g. user is already on `/workouts` and re-taps the dashboard "Schedule"
  // pill — Expo Router updates the search params without remounting).
  React.useEffect(() => {
    const next = normalizeInitialTab(props.initialTab);
    setTab((prev) => (prev === next ? prev : next));
  }, [props.initialTab]);

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

