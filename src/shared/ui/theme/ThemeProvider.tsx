import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { darkTheme, type AppTheme } from "./tokens";

type ThemeContextValue = {
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  // Future-proof: allow swapping theme later (system / trainer brand, etc.)
  const value = useMemo<ThemeContextValue>(() => ({ theme: darkTheme }), []);

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

