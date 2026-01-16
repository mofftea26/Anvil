import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";

type LoadingSpinnerProps = {
  size?: "small" | "large";
  color?: string;
};

export function LoadingSpinner({
  size = "large",
  color,
}: LoadingSpinnerProps) {
  const theme = useTheme();
  const spinnerColor = color ?? theme.colors.text;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 60,
  },
});
