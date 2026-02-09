import React from "react";
import { useLocalSearchParams } from "expo-router";

import { ClientProgramDayDetailScreen } from "@/features/workouts/screens/ClientProgramDayDetailScreen";

export default function Screen() {
  const { assignmentId, dayKey } = useLocalSearchParams<{ assignmentId?: string; dayKey?: string }>();
  return (
    <ClientProgramDayDetailScreen
      assignmentId={String(assignmentId ?? "")}
      dayKey={String(dayKey ?? "")}
    />
  );
}

