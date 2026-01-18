import React from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import { useTheme } from "../theme";

type Props = ViewProps & {
  opacity?: number;
};

export function Divider({ style, opacity = 1, ...props }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        { height: 1, backgroundColor: theme.colors.border, opacity },
        style,
      ]}
      {...props}
    />
  );
}

