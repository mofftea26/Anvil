import React from "react";
import type { ViewProps, ViewStyle } from "react-native";
import { View } from "react-native";
import type { AppTheme } from "../theme";
import { useTheme } from "../theme";

type Props = ViewProps & {
  padded?: boolean;
  radius?: keyof AppTheme["radii"];
  bordered?: boolean;
  background?: "surface" | "surface2" | "background";
};

export function Card({
  style,
  padded = true,
  radius = "lg",
  bordered = false,
  background = "surface",
  ...props
}: Props) {
  const theme = useTheme();

  const bg =
    background === "surface2"
      ? theme.colors.surface2
      : background === "background"
        ? theme.colors.background
        : theme.colors.surface;

  const s: ViewStyle = {
    backgroundColor: bg,
    borderRadius: theme.radii[radius],
    borderWidth: bordered ? 1 : 0,
    borderColor: theme.colors.border,
    padding: padded ? theme.spacing.lg : 0,
  };

  return <View style={[s, style]} {...props} />;
}

