import { Ionicons } from "@expo/vector-icons";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useTheme } from "@/shared/ui";

export const useTrainerTabsLayout = () => {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      height: 74,
      paddingBottom: 10,
      paddingTop: 10,
    },
    tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
    tabBarActiveTintColor: theme.colors.accent,
    tabBarInactiveTintColor: "rgba(255,255,255,0.65)",
  };

  const dashboardOptions = {
    title: t("tabs.dashboard"),
    tabBarIcon: ({ color, size, focused }: any) => (
      <Ionicons
        name={focused ? "analytics" : "analytics-outline"}
        size={size}
        color={color}
      />
    ),
  };

  const clientsOptions = {
    title: t("tabs.clients"),
    tabBarIcon: ({ color, size, focused }: any) => (
      <Ionicons
        name={focused ? "people" : "people-outline"}
        size={size}
        color={color}
      />
    ),
  };

  const profileOptions = {
    title: t("tabs.profile"),
    tabBarIcon: ({ color, size, focused }: any) => (
      <Ionicons
        name={focused ? "person" : "person-outline"}
        size={size}
        color={color}
      />
    ),
  };

  return { screenOptions, dashboardOptions, clientsOptions, profileOptions };
};
