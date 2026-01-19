import { Stack } from "expo-router";
import React from "react";
import { useTheme } from "@/src/shared/ui";

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
