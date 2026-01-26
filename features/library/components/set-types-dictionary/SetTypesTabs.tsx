import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { SetTypesCategory } from "@/features/library/hooks/useSetTypesDictionary";
import { Icon, Text, useTheme } from "@/shared/ui";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

type SetTypesTabsProps = {
  tabs: SetTypesCategory[];
  activeTabKey: string;
  onSelect: (key: string) => void;
};

const categoryIcons: Record<string, string> = {
  foundational: "fitness",
  intensity: "flash",
  volume: "timer",
};

export function SetTypesTabs({ tabs, activeTabKey, onSelect }: SetTypesTabsProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.tabsWrap,
        {
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTabKey;
          const iconName = categoryIcons[tab.key] || "fitness";

          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: isActive
                    ? hexToRgba(theme.colors.accent, 0.15)
                    : theme.colors.surface2,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Icon
                name={iconName}
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
              {tab.rows.length > 0 ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isActive
                        ? theme.colors.accent
                        : theme.colors.surface3,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isActive ? "white" : theme.colors.textMuted,
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {tab.rows.length}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    paddingVertical: 12,
  },
  tabsContent: {
    paddingHorizontal: 14,
    gap: 10,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 40,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
