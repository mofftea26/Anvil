import { Tabs } from "expo-router";
import React from "react";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, useTheme } from "@/shared/ui";

export default function TrainerTabsLayout() {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const bg = theme.colors.surface;
  const border = theme.colors.border;
  const active = theme.colors.accent;
  const inactive = "rgba(255,255,255,0.65)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          borderTopWidth: 1,
          height: 74,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
      }}
    >
 <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard"),
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? "analytics" : "analytics-outline"}
              size={size}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />

      {/* ✅ NEW: Library tab */}
      <Tabs.Screen
        name="library"
        options={{
          title: t("tabs.library"), // add translation key if missing
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? "layers" : "layers-outline"}
              size={size}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="clients"
        options={{
          title: t("tabs.clients"),
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? "people" : "people-outline"}
              size={size}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
    </Tabs>
  );
}
