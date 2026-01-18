import { Redirect, Stack } from "expo-router";

import { useTrainerLayout } from "@/features/trainer/hooks/useTrainerLayout";

export default function TrainerLayout() {
  const decision = useTrainerLayout();

  if (decision.type === "redirect") {
    return <Redirect href={decision.href} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
