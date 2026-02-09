import React from "react";
import { useLocalSearchParams } from "expo-router";

import { WorkoutSessionDetailsScreen } from "@/features/workouts/screens/WorkoutSessionDetailsScreen";

export default function Screen() {
  const { sessionId, celebrate } = useLocalSearchParams<{
    sessionId?: string;
    celebrate?: string;
  }>();
  return (
    <WorkoutSessionDetailsScreen
      sessionId={String(sessionId ?? "")}
      celebrate={celebrate === "1"}
    />
  );
}

