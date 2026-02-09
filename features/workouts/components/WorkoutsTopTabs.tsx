import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

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

  const tabs: Array<{ key: WorkoutsTopTabKey; title: string; hidden?: boolean }> =
    [
      { key: "program", title: t("client.workouts.program", "My Program") },
      { key: "schedule", title: t("client.workouts.schedule", "Schedule") },
      { key: "history", title: t("client.workouts.history", "History") },
      { key: "stats", title: t("client.workouts.stats", "Stats"), hidden: !props.showStats },
    ];

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: theme.spacing.lg },
        ]}
      >
        {tabs
          .filter((x) => !x.hidden)
          .map((tab) => {
            const isActive = tab.key === props.active;
            return (
              <Pressable
                key={tab.key}
                onPress={() => props.onChange(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  {
                    backgroundColor: isActive
                      ? hexToRgba(theme.colors.accent, 0.15)
                      : theme.colors.surface2,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Icon
                  name={icons[tab.key]}
                  size={16}
                  color={isActive ? theme.colors.accent : theme.colors.textMuted}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <Text
                  style={{
                    color: isActive ? theme.colors.accent : theme.colors.text,
                    fontWeight: isActive ? "700" : "600",
                    fontSize: 13,
                  }}
                  numberOfLines={1}
                >
                  {tab.title}
                </Text>
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 10 },
  content: { gap: 10 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 40,
  },
});

