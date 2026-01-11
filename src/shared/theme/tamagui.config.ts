// src/shared/theme/tamagui.config.ts
import { tokens } from "@tamagui/config/v3";
import { createInterFont } from "@tamagui/font-inter";
import { createTamagui } from "tamagui";

const headingFont = createInterFont({
  face: {
    400: { normal: "Inter_400Regular" },
    600: { normal: "Inter_600SemiBold" },
    700: { normal: "Inter_700Bold" },
  },
});

const bodyFont = createInterFont({
  face: {
    400: { normal: "Inter_400Regular" },
    600: { normal: "Inter_600SemiBold" },
    700: { normal: "Inter_700Bold" },
  },
});

export const tamaguiConfig = createTamagui({
  defaultTheme: "dark",
  shouldAddPrefersColorThemes: false, // IMPORTANT: no light theme ever
  themeClassNameOnRoot: true,

  tokens,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },

  themes: {
    dark: {
      // backgrounds
      background: "#0B0D10",
      color: "#E7EAF0",

      // surfaces (use these in cards/sheets later)
      surface: "#11151B",
      surface2: "#161C24",

      // text
      colorMuted: "#AAB3C2",

      // border
      borderColor: "rgba(255,255,255,0.08)",

      // accents
      accent: "#A3FF12", // electric lime
      accent2: "#22D3EE", // cyan
    } as any,
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
