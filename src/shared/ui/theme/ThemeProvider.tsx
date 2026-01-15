import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { darkTheme, type AppTheme } from "./tokens";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useGetTrainerProfileQuery } from "../../../features/profile/api/profileApiSlice";
import { useGetMyCoachQuery } from "../../../features/linking/api/linkingApiSlice";

type ThemeContextValue = {
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isHexColor(v: string) {
  const s = (v ?? "").trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const auth = useAppSelector((s) => s.auth);
  const userId = auth.userId ?? "";
  const role = auth.role ?? null;

  // Trainer brand (when logged in as trainer).
  const { data: myTrainerProfile } = useGetTrainerProfileQuery(userId, {
    skip: !userId || role !== "trainer",
  });

  // Coach brand (when logged in as client and linked).
  const { data: myCoach } = useGetMyCoachQuery(
    { clientId: userId },
    { skip: !userId || role !== "client" }
  );

  const brandPrimaryRaw =
    role === "trainer"
      ? myTrainerProfile?.primaryColor ?? null
      : myCoach?.trainerProfile?.primaryColor ?? null;
  const brandSecondaryRaw =
    role === "trainer"
      ? myTrainerProfile?.secondaryColor ?? null
      : myCoach?.trainerProfile?.secondaryColor ?? null;

  const brandPrimary =
    brandPrimaryRaw && isHexColor(brandPrimaryRaw)
      ? brandPrimaryRaw
      : null;
  const brandSecondary =
    brandSecondaryRaw && isHexColor(brandSecondaryRaw)
      ? brandSecondaryRaw
      : null;

  const theme = useMemo<AppTheme>(() => {
    // Default brand is Anvil’s tokens.
    if (!brandPrimary && !brandSecondary) return darkTheme;

    return {
      ...darkTheme,
      colors: {
        ...darkTheme.colors,
        accent: brandPrimary ?? darkTheme.colors.accent,
        // Keep errors/destructive on `danger`. `accent2` becomes "secondary brand".
        accent2: brandSecondary ?? darkTheme.colors.accent2,
      },
    };
  }, [brandPrimary, brandSecondary]);

  const value = useMemo<ThemeContextValue>(() => ({ theme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style="light" />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx.theme;
}

