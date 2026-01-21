import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useTheme } from "@/shared/ui";

export function useExercises() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  return {
    t,
    theme,
    title: t("library.exercises"),
    subtitle: t("library.exercisesScreen.subtitle"),
  };
}
