import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./resources/ar.json";
import en from "./resources/en.json";
import fr from "./resources/fr.json";

/**
 * Supported languages:
 * - en (English)
 * - fr (French)
 * - ar (Arabic, RTL)
 */
export const supportedLanguages = ["en", "fr", "ar"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

function detectLanguage(): AppLanguage {
  const device =
    Localization.getLocales()?.[0]?.languageCode?.toLowerCase() ?? "en";
  if (device === "fr") return "fr";
  if (device === "ar") return "ar";
  return "en";
}

export const defaultLanguage: AppLanguage = detectLanguage();

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: defaultLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
