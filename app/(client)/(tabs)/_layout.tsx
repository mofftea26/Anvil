import { Tabs } from "expo-router";
import React from "react";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, useTheme } from "@/shared/ui";

export default function ClientTabsLayout() {
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
            <Icon
              name={focused ? "dashboard" : "dashboard-outline"}
              size={size}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="workouts"
        options={{
          title: t("tabs.workouts", "Workouts"),
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? "calendar-03" : "calendar-03"}
              size={size}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="coach"
        options={{
          title: t("tabs.coach"),
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name={focused ? "barbell" : "barbell-outline"}
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
