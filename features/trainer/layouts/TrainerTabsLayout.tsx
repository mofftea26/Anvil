import { Tabs } from "expo-router";
import React from "react";

import { useTrainerTabsLayout } from "@/features/trainer/hooks/useTrainerTabsLayout";

export default function TrainerTabsLayout() {
  const { screenOptions, dashboardOptions, clientsOptions, profileOptions } =
    useTrainerTabsLayout();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="dashboard" options={dashboardOptions} />
      <Tabs.Screen name="clients" options={clientsOptions} />
      <Tabs.Screen name="profile" options={profileOptions} />
    </Tabs>
  );
}
