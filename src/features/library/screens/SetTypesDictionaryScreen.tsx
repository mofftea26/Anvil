import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useSetTypesDictionary } from "@/src/features/library/hooks/useSetTypesDictionary";
import { useAppTranslation } from "@/src/shared/i18n/useAppTranslation";
import { StickyHeader, Text, useTheme } from "@/src/shared/ui";

type TabItem = {
  key: string; // must be UNIQUE
  title: string;
  rows: any[];
};

const DEFAULT_TABS = [
  "Foundational Sets",
  "Intensity-Boosting Methods",
  "Volume & Conditioning Methods",
];

export default function SetTypesDictionaryScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const { rows, categories, isLoading, error } = useSetTypesDictionary();

  const tabs: TabItem[] = useMemo(() => {
    // supports categories being strings or objects
    const rawTabs: TabItem[] = (categories?.length ? categories : DEFAULT_TABS).map(
      (c: any, index: number) => {
        // If it's a string category
        if (typeof c === "string") {
          return {
            key: c,
            title: c,
            rows: rows?.filter((r: any) => r.category === c) ?? [],
          };
        }

        // If it's already an object from the hook {key,title,rows}
        const key =
          typeof c?.key === "string"
            ? c.key
            : typeof c?.title === "string"
            ? c.title
            : `tab-${index}`;

        return {
          key,
          title: typeof c?.title === "string" ? c.title : key,
          rows: Array.isArray(c?.rows) ? c.rows : [],
        };
      }
    );

    // ensure UNIQUE keys always (no more duplicate key warning)
    const seen = new Set<string>();
    return rawTabs.map((tab, i) => {
      let safeKey = tab.key;
      if (seen.has(safeKey)) safeKey = `${tab.key}-${i}`;
      seen.add(safeKey);
      return { ...tab, key: safeKey };
    });
  }, [categories, rows]);

  const [activeTabKey, setActiveTabKey] = useState<string>(() => tabs[0]?.key ?? "tab-0");

  const activeTab = useMemo(
    () => tabs.find((x) => x.key === activeTabKey) ?? tabs[0],
    [tabs, activeTabKey]
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text>Error loading set types.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StickyHeader
        title={t("library.setTypesDictionary", "Set Types Dictionary")}
        showBackButton
      />

      {/* Tabs */}
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
                onPress={() => setActiveTabKey(tab.key)}
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

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab?.rows?.length ? (
          activeTab.rows.map((row: any, index: number) => (
            <View
              key={row?.id ? String(row.id) : `${activeTab.key}-row-${index}`}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={{ fontWeight: "800", fontSize: 16 }}>
                {row?.name ?? row?.title}
              </Text>

              {row?.description ? (
                <Text style={{ opacity: 0.85, marginTop: 6 }}>{row.description}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={{ opacity: 0.7 }}>No items in this category.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

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

  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  empty: {
    paddingVertical: 24,
    alignItems: "center",
  },
});
