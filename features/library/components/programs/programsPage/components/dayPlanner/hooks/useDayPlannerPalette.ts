import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useMemo } from "react";

import { useTheme } from "@/shared/ui";

export function useDayPlannerPalette() {
  const theme = useTheme();

  return useMemo(
    () => ({
      backdrop: "rgba(0,0,0,0.62)",
      sheetBg: theme.colors.surface2 ?? theme.colors.surface,
      sheetBorder: hexToRgba(theme.colors.accent, 0.14),
      sheetShadow: hexToRgba(theme.colors.accent, 0.08),
      handle: hexToRgba(theme.colors.accent, 0.5),
      handleTrack: hexToRgba(theme.colors.accent, 0.12),
      headerGradientStart: hexToRgba(theme.colors.accent, 0.14),
      headerGradientMid: hexToRgba(theme.colors.accent2, 0.06),
      headerGradientEnd: "transparent",
      headerBorder: hexToRgba(theme.colors.accent, 0.1),
      title: theme.colors.text,
      subtitle: hexToRgba(theme.colors.textMuted, 0.95),
      addBtnIcon: theme.colors.accent,
      emptyIconBg: hexToRgba(theme.colors.accent, 0.1),
      emptyIcon: theme.colors.accent,
      emptyText: theme.colors.text,
      emptyHint: hexToRgba(theme.colors.textMuted, 0.9),
      cardPlaceholderBg: hexToRgba(theme.colors.text, 0.05),
      swipeActionGradientStart: hexToRgba(theme.colors.danger, 0.42),
      swipeActionGradientEnd: hexToRgba(theme.colors.danger, 0.16),
      swipeActionText: "#fff",
    }),
    [
      theme.colors.accent,
      theme.colors.accent2,
      theme.colors.danger,
      theme.colors.surface,
      theme.colors.surface2,
      theme.colors.text,
      theme.colors.textMuted,
    ]
  );
}
