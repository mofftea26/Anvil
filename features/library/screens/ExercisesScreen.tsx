import React from "react";

import { LibraryPlaceholderView } from "@/features/library/components/shared/LibraryPlaceholderView";
import { useExercises } from "@/features/library/hooks/exercises/useExercises";

export default function ExercisesScreen() {
  const { title, subtitle } = useExercises();
  return <LibraryPlaceholderView title={title} subtitle={subtitle} />;
}
