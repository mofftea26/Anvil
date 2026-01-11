import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "./i18n";
import i18n from "./i18n";
import { applyRtlIfNeeded } from "./rtl";

export function useAppTranslation() {
  const { t } = useTranslation();

  const language = i18n.language as AppLanguage;

  const setLanguage = useCallback(async (lng: AppLanguage) => {
    await i18n.changeLanguage(lng);
    applyRtlIfNeeded(lng);
  }, []);

  return { t, language, setLanguage };
}
