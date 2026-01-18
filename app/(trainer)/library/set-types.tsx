import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  SetTypeRow,
  useSetTypesDictionary,
} from "@/src/features/library/hooks/useSetTypesDictionary";
import { useAppTranslation } from "@/src/shared/i18n/useAppTranslation";
import { StickyHeader, useTheme } from "../../../src/shared/ui";
import { Text } from "../../../src/shared/ui/components/Text";

const DEFAULT_TABS = [
  "Foundational Sets",
  "Intensity-Boosting Methods",
  "Volume & Conditioning Methods",
];

type TabLayout = { x: number; width: number };

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SetTypesDictionaryScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const { rows, categories, isLoading, error } = useSetTypesDictionary();

  const tabs = categories.length ? categories : DEFAULT_TABS;

  const [activeTab, setActiveTab] = useState<string>(tabs[0] ?? DEFAULT_TABS[0]);

  // keep selection valid when categories load/change
  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0] ?? DEFAULT_TABS[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.join("|")]);

  const filtered = useMemo(() => {
    return rows.filter((r: SetTypeRow) => r.category === activeTab);
  }, [rows, activeTab]);

  /**
   * Sticky + collapsing tabs
   */
  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedY = Animated.diffClamp(scrollY, 0, 80);

  const tabsHeight = clampedY.interpolate({
    inputRange: [0, 80],
    outputRange: [54, 40], // smaller overall
    extrapolate: "clamp",
  });

  const tabsPaddingV = clampedY.interpolate({
    inputRange: [0, 80],
    outputRange: [10, 6], // tighter on scroll
    extrapolate: "clamp",
  });

  /**
   * Auto-center active tab
   */
  const tabsScrollRef = useRef<ScrollView | null>(null);
  const tabLayoutsRef = useRef<Record<string, TabLayout>>({});

  const centerTab = (tab: string) => {
    const layout = tabLayoutsRef.current[tab];
    if (!layout || !tabsScrollRef.current) return;

    const targetX = Math.max(0, layout.x - (SCREEN_WIDTH - layout.width) / 2);
    tabsScrollRef.current.scrollTo({ x: targetX, animated: true });
  };

  /**
   * Haptics (Expo-safe)
   */
  const triggerHaptic = async () => {
    try {
      const Haptics = await import("expo-haptics");
      await Haptics.selectionAsync();
    } catch {
      // no-op if not available
    }
  };

  const onPressTab = async (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    triggerHaptic();
    // center after state update (but also try immediately)
    centerTab(tab);
  };

  useEffect(() => {
    const id = setTimeout(() => centerTab(activeTab), 0);
    return () => clearTimeout(id);
     
  }, [activeTab]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StickyHeader
        title={t("library.setTypes", "Set Types Dictionary")}
        showBackButton={true}
      />

      {/* Redesigned Tabs (no global moving underline) */}
      <Animated.View
        style={[
          styles.tabsBar,
          {
            height: tabsHeight,
            paddingVertical: tabsPaddingV,
            paddingHorizontal: theme.spacing.lg,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ScrollView
          ref={(r: any) => (tabsScrollRef.current = r)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {tabs.map((tab) => {
            const isActive = tab === activeTab;

            return (
              <Pressable
                key={tab}
                onPress={() => onPressTab(tab)}
                style={({ pressed }) => [
                  styles.tabBtn,
                  {
                    backgroundColor: pressed
                      ? theme.colors.surface2
                      : "transparent",
                    borderColor: isActive
                      ? theme.colors.border
                      : "transparent",
                  },
                ]}
                onLayout={(e) => {
                  // used ONLY for centering, not for underline accuracy
                  tabLayoutsRef.current[tab] = {
                    x: e.nativeEvent.layout.x,
                    width: e.nativeEvent.layout.width,
                  };
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    color: isActive
                      ? theme.colors.text
                      : theme.colors.textMuted,
                    fontSize: 13,
                    fontWeight: isActive ? "600" : "500",
                    letterSpacing: 0.2,
                  }}
                >
                  {tab}
                </Text>

                {/* Perfect underline: lives inside the active tab */}
                {isActive ? (
                  <View style={styles.underlineWrap}>
                    <View
                      style={[
                        styles.underline,
                        { backgroundColor: theme.colors.accent },
                      ]}
                    />
                  </View>
                ) : (
                  <View style={styles.underlineWrap} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Body */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: 12 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {isLoading && (
          <Text style={{ color: theme.colors.textMuted }}>
            Loading set types...
          </Text>
        )}

        {error && (
          <Text style={{ color: theme.colors.danger }}>Error: {error}</Text>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <Text style={{ color: theme.colors.textMuted }}>
            No set types found in this category.
          </Text>
        )}

        {filtered.map((item: SetTypeRow) => (
          <View
            key={item.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16 }}>
              {item.title}
            </Text>

            {!!item.description && (
              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 13,
                  lineHeight: 18,
                  marginTop: 6,
                }}
              >
                {item.description}
              </Text>
            )}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  tabsBar: {
    borderBottomWidth: 1,
    justifyContent: "center",
  },

  tabsRow: {
    alignItems: "center",
    gap: 10,
    paddingRight: 10,
  },

  /**
   * New tab design:
   * - compact height
   * - subtle pressed background
   * - active state via text weight + underline
   */
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1, // only visible when active
  },

  underlineWrap: {
    height: 8,
    justifyContent: "flex-end",
    marginTop: 2,
  },

  underline: {
    height: 2,
    borderRadius: 99,
    width: "60%", // iOS-like inset underline
    alignSelf: "center",
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
});
