import React from "react";
import { useLocalSearchParams } from "expo-router";

import { ClientProgramScheduleScreen } from "@/features/workouts/screens/ClientProgramScheduleScreen";

export default function Screen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  return <ClientProgramScheduleScreen assignmentId={String(assignmentId ?? "")} />;
}

