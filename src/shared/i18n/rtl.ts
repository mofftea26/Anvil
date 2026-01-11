import { I18nManager } from "react-native";
import type { AppLanguage } from "./i18n";

/**
 * IMPORTANT:
 * React Native RTL layout requires an app reload to fully apply.
 * For now we enforce RTL direction at startup.
 */
export function isRtlLanguage(lang: AppLanguage) {
  return lang === "ar";
}

export function applyRtlIfNeeded(lang: AppLanguage) {
  const shouldBeRtl = isRtlLanguage(lang);

  if (I18nManager.isRTL !== shouldBeRtl) {
    I18nManager.allowRTL(shouldBeRtl);
    I18nManager.forceRTL(shouldBeRtl);
    // Full reload is needed for some layout direction changes.
    // We'll add a "restart app" helper later if you want (dev-friendly).
  }
}
