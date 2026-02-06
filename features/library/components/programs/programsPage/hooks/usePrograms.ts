import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useTheme } from "@/shared/ui";

export function usePrograms() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  return {
    t,
    theme,
    title: t("library.programs"),
    subtitle: t("library.programsScreen.subtitle"),
  };
}
