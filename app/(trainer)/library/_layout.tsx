import { useTheme } from "@/shared/ui";
import { Stack } from "expo-router";
import React from "react";

export default function TrainerLibraryLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleStyle: { color: theme.colors.text },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
