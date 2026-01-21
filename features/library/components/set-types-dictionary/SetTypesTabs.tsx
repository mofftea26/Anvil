import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { SetTypesCategory } from "@/features/library/hooks/useSetTypesDictionary";
import { Text, useTheme } from "@/shared/ui";

type SetTypesTabsProps = {
  tabs: SetTypesCategory[];
  activeTabKey: string;
  onSelect: (key: string) => void;
};

export function SetTypesTabs({ tabs, activeTabKey, onSelect }: SetTypesTabsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.tabsWrap, { borderBottomColor: theme.colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTabKey;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive ? theme.colors.surface2 : theme.colors.surface,
                  borderColor: isActive ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? theme.colors.accent : theme.colors.text,
                  fontWeight: isActive ? "700" : "600",
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
  tabsWrap: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  tabsContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 260,
  },
});
