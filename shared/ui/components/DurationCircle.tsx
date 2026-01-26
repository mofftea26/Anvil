import React from "react";
import { StyleSheet, View } from "react-native";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { VStack } from "../layout/Stack";
import { useTheme } from "../theme";
import { Text } from "./Text";

type DurationCircleProps = {
  minutes: number | null;
  size?: "small" | "medium" | "large";
};

export function DurationCircle({ minutes, size = "small" }: DurationCircleProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const sizeMap = {
    small: { circle: 40, number: 12, label: 7, border: 1.5 },
    medium: { circle: 48, number: 14, label: 8, border: 1.5 },
    large: { circle: 56, number: 16, label: 9, border: 2 },
  };

  const dimensions = sizeMap[size];
  const hasValue = minutes !== null && minutes !== undefined && minutes > 0;

  return (
    <View
      style={[
        styles.durationBadge,
        {
          width: dimensions.circle,
          height: dimensions.circle,
          borderRadius: dimensions.circle / 2,
          borderWidth: dimensions.border,
          borderColor: theme.colors.accent,
          backgroundColor: "transparent",
        },
      ]}
    >
      <VStack align="center" style={styles.durationContent}>
        <Text
          weight="bold"
          style={[
            styles.durationNumber,
            {
              color: theme.colors.accent,
              fontSize: hasValue ? dimensions.number : dimensions.number - 2,
              lineHeight: hasValue ? dimensions.number : dimensions.number - 2,
            },
          ]}
        >
          {hasValue ? minutes : "N/A"}
        </Text>
        {hasValue && (
          <Text
            style={[
              styles.durationLabel,
              {
                color: theme.colors.accent2,
                fontSize: dimensions.label,
                fontWeight: "600",
                letterSpacing: 0.3,
                lineHeight: dimensions.label + 1,
              },
            ]}
          >
            {t("common.duration.mins")}
          </Text>
        )}
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  durationBadge: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  durationContent: {
    gap: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  durationNumber: {
    fontWeight: "700",
    margin: 0,
    padding: 0,
  },
  durationLabel: {
    textTransform: "uppercase",
    margin: 0,
    marginTop: -2,
    padding: 0,
  },
});
