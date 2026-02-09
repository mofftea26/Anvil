import React from "react";
import { useLocalSearchParams } from "expo-router";

import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { WorkoutRunScreen } from "@/features/workouts/screens/WorkoutRunScreen";

export default function Screen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  const clientId = useAppSelector((s) => s.auth.userId);
  return (
    <WorkoutRunScreen
      clientId={String(clientId ?? "")}
      assignmentId={String(assignmentId ?? "")}
    />
  );
}

