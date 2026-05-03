import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

export type WorkoutsTopTabKey = "program" | "schedule" | "history" | "stats";

const icons: Record<WorkoutsTopTabKey, string> = {
  program: "layers-outline",
  schedule: "calendar-03",
  history: "timer-outline",
  stats: "analytics-outline",
};

export function WorkoutsTopTabs(props: {
  active: WorkoutsTopTabKey;
  onChange: (next: WorkoutsTopTabKey) => void;
  showStats: boolean;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 0.985,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(pulse, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 4,
      }),
    ]).start();
  }, [props.active, pulse]);

  const tabs: { key: WorkoutsTopTabKey; title: string; hidden?: boolean }[] =
    [
      { key: "program", title: t("client.workouts.program", "Program") },
      { key: "schedule", title: t("client.workouts.schedule", "Schedule") },
      { key: "history", title: t("client.workouts.history", "History") },
      { key: "stats", title: t("client.workouts.stats", "Stats"), hidden: !props.showStats },
    ];

  const visibleTabs = tabs.filter((x) => !x.hidden);

  return (
    <View style={[styles.wrap, { paddingHorizontal: theme.spacing.sm }]}>
      <Animated.View
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
            transform: [{ scale: pulse }],
          },
        ]}
      >
        {visibleTabs.map((tab) => {
          const isActive = tab.key === props.active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => props.onChange(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                {
                  opacity: pressed ? 0.84 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  backgroundColor: isActive ? theme.colors.surface : "transparent",
                },
              ]}
            >
              <Icon
                name={icons[tab.key]}
                size={15}
                color={isActive ? theme.colors.accent : theme.colors.textMuted}
                strokeWidth={isActive ? 2 : 1.6}
              />
              <Text
                style={{
                  color: isActive ? theme.colors.text : theme.colors.textMuted,
                  fontWeight: isActive ? "700" : "600",
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                {tab.title}
              </Text>
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    backgroundColor: isActive ? theme.colors.accent : "transparent",
                    transform: [{ scaleX: isActive ? 1 : 0.7 }],
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4, paddingBottom: 2 },
  row: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 3,
    gap: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    bottom: 3,
    width: 16,
    height: 2,
    borderRadius: 999,
  },
});

