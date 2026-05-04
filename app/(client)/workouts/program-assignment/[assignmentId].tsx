import React from "react";
import { useLocalSearchParams } from "expo-router";

import { ProgramProgressScreen } from "@/features/workouts/screens/ProgramProgressScreen";

export default function Screen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  return <ProgramProgressScreen assignmentId={String(assignmentId ?? "")} />;
}

