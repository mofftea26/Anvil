import React from "react";
import { useLocalSearchParams } from "expo-router";

import { AssignedWorkoutDetailsScreen } from "@/features/workouts/screens/AssignedWorkoutDetailsScreen";

export default function Screen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  return <AssignedWorkoutDetailsScreen assignmentId={String(assignmentId ?? "")} />;
}

