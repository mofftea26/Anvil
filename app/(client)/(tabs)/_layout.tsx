import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";

export default function ClientTabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useAppTranslation();

  const bg = String(theme.surface?.get());
  const border = String(theme.borderColor?.get());
  const active = String(theme.accent?.get());
  const inactive = "rgba(255,255,255,0.65)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarItemStyle: {
          borderRadius: 999,
          marginHorizontal: 8,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
