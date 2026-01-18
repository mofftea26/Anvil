import { Tabs } from "expo-router";
import React from "react";

import { useClientTabsLayout } from "@/features/client/hooks/useClientTabsLayout";

export default function ClientTabsLayout() {
  const { screenOptions, dashboardOptions, coachOptions, profileOptions } =
    useClientTabsLayout();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="dashboard" options={dashboardOptions} />
      <Tabs.Screen name="coach" options={coachOptions} />
      <Tabs.Screen name="profile" options={profileOptions} />
    </Tabs>
  );
}
