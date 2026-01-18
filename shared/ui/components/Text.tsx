import React from "react";
import type { TextProps, TextStyle } from "react-native";
import { Text as RNText } from "react-native";
import { useTheme } from "../theme";

export type AppTextVariant = "title" | "body" | "caption";

type Props = TextProps & {
  variant?: AppTextVariant;
  color?: string;
  weight?: "regular" | "semibold" | "bold";
  muted?: boolean;
};

export function Text({
  variant = "body",
  color,
  muted,
  weight = "regular",
  style,
  ...props
}: Props) {
  const theme = useTheme();

  const base: TextStyle = {
    color: color ?? (muted ? theme.colors.textMuted : theme.colors.text),
    fontFamily:
      weight === "bold"
        ? theme.typography.fontFamilyBold
        : weight === "semibold"
          ? theme.typography.fontFamilySemiBold
          : theme.typography.fontFamilyRegular,
  };

  const variantStyle: TextStyle =
    variant === "title"
      ? { fontSize: theme.typography.fontSizeTitle }
      : variant === "caption"
        ? { fontSize: theme.typography.fontSizeCaption }
        : {
            fontSize: theme.typography.fontSizeBody,
            lineHeight: theme.typography.lineHeightBody,
          };

  return <RNText style={[base, variantStyle, style]} {...props} />;
}

