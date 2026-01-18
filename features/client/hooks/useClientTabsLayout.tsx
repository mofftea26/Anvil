import { Ionicons } from "@expo/vector-icons";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useTheme } from "@/shared/ui";

export const useClientTabsLayout = () => {
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
    tabBarItemStyle: {
      borderRadius: 999,
      marginHorizontal: 8,
    },
    tabBarIconStyle: { marginTop: 2 },
  };

  const dashboardOptions = {
    title: t("tabs.dashboard"),
    tabBarIcon: ({ color, size, focused }: any) => (
      <Ionicons
        name={focused ? "grid" : "grid-outline"}
        size={size}
        color={color}
      />
    ),
  };

  const coachOptions = {
    title: t("tabs.coach"),
    tabBarIcon: ({ color, size, focused }: any) => (
      <Ionicons
        name={focused ? "barbell" : "barbell-outline"}
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

  return { screenOptions, dashboardOptions, coachOptions, profileOptions };
};
