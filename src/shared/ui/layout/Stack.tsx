import React from "react";
import type { ViewProps, ViewStyle } from "react-native";
import { View } from "react-native";

type BaseStackProps = ViewProps & {
  gap?: number;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
};

export function VStack({
  style,
  gap,
  align,
  justify,
  ...props
}: BaseStackProps) {
  return (
    <View
      style={[
        { flexDirection: "column" as const },
        gap !== undefined ? ({ gap } as ViewStyle) : null,
        align ? { alignItems: align } : null,
        justify ? { justifyContent: justify } : null,
        style,
      ]}
      {...props}
    />
  );
}

export function HStack({
  style,
  gap,
  align,
  justify,
  ...props
}: BaseStackProps) {
  return (
    <View
      style={[
        { flexDirection: "row" as const },
        gap !== undefined ? ({ gap } as ViewStyle) : null,
        align ? { alignItems: align } : null,
        justify ? { justifyContent: justify } : null,
        style,
      ]}
      {...props}
    />
  );
}

