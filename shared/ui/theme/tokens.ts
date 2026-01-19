export type AppThemeColors = {
  background: string;
  surface: string;
  surface2: string;
  surface3: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accent2: string;
  danger: string;
};

export type AppThemeSpacing = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

export type AppThemeRadii = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  pill: number;
};

export type AppThemeTypography = {
  fontFamilyRegular: string;
  fontFamilySemiBold: string;
  fontFamilyBold: string;
  fontSizeCaption: number;
  fontSizeBody: number;
  fontSizeTitle: number;
  lineHeightBody: number;
};

export type AppTheme = {
  colors: AppThemeColors;
  spacing: AppThemeSpacing;
  radii: AppThemeRadii;
  typography: AppThemeTypography;
};

/**
 * Dark-only theme (aligns with existing app behavior).
 * Keep this file “dumb”: tokens only, no React imports.
 */
export const darkTheme: AppTheme = {
  colors: {
    background: "#0B0D10",
    surface: "#11151B",
    surface2: "#161C24",
    surface3: "#1E242E",
    text: "#E7EAF0",
    textMuted: "#AAB3C2",
    border: "rgba(255,255,255,0.10)",
    accent: "#A3FF12",
    accent2: "#22D3EE",
    danger: "#FF4D4D",
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  typography: {
    // Fonts loaded in app/_layout.tsx via expo-font.
    fontFamilyRegular: "Inter_400Regular",
    fontFamilySemiBold: "Inter_600SemiBold",
    fontFamilyBold: "Inter_700Bold",
    fontSizeCaption: 13,
    fontSizeBody: 15,
    fontSizeTitle: 22,
    lineHeightBody: 22,
  },
};

