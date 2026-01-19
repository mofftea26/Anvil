import { LinearGradient } from "expo-linear-gradient";
import React from "react";

import { useTheme } from "../theme";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  const hasAlpha = h.length === 8;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const finalA = Math.max(0, Math.min(1, alpha * a));
  return `rgba(${r},${g},${b},${finalA})`;
}

/**
 * Shared tab background gradient (matches Profile tabs).
 * Render as the first child inside a full-screen container.
 */
export function TabBackgroundGradient() {
  const theme = useTheme();
  const brandA = theme.colors.accent;
  const brandB = theme.colors.accent2;

  return (
    <LinearGradient
      colors={[
        hexToRgba(brandA, 0.45),
        hexToRgba(brandB, 0.3),
        "rgba(0,0,0,0.00)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
    />
  );
}

