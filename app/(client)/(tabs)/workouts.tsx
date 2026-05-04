import React from "react";
import { useLocalSearchParams } from "expo-router";

import { ClientWorkoutsScreen } from "@/features/workouts/screens/ClientWorkoutsScreen";

export default function Screen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return <ClientWorkoutsScreen initialTab={tab ?? null} />;
}
