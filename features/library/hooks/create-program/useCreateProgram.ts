import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useTheme } from "@/shared/ui";

export function useCreateProgram() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  return {
    t,
    theme,
    title: t("library.createProgram.title"),
    subtitle: t("library.createProgram.subtitle"),
  };
}
