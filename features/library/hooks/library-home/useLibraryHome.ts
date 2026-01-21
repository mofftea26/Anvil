import { router } from "expo-router";
import { useCallback } from "react";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

export function useLibraryHome() {
  const { t } = useAppTranslation();

  const onNewProgram = useCallback(() => {
    router.push("/(trainer)/library/create-program" as Parameters<typeof router.push>[0]);
  }, []);

  const onNewWorkout = useCallback(() => {
    router.push("/(trainer)/library/workout-builder/new" as Parameters<typeof router.push>[0]);
  }, []);

  const onPrograms = useCallback(() => {
    router.push("/(trainer)/library/programs" as Parameters<typeof router.push>[0]);
  }, []);

  const onWorkouts = useCallback(() => {
    router.push("/(trainer)/library/workouts" as Parameters<typeof router.push>[0]);
  }, []);

  const onExercises = useCallback(() => {
    router.push("/(trainer)/library/exercises" as Parameters<typeof router.push>[0]);
  }, []);

  const onSetTypes = useCallback(() => {
    router.push("/(trainer)/library/set-types" as Parameters<typeof router.push>[0]);
  }, []);

  return {
    t,
    onNewProgram,
    onNewWorkout,
    onPrograms,
    onWorkouts,
    onExercises,
    onSetTypes,
  };
}
