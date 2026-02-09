import type { SetTypeRow } from "@/features/library/types/setTypes";
import { getSetTypeIconName } from "@/features/library/utils/setTypeIcons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { Card, Icon, Text, useTheme } from "@/shared/ui";

type SetTypesCardProps = {
  row: SetTypeRow;
};

export function SetTypesCard({ row }: SetTypesCardProps) {
  const theme = useTheme();
  const title = row?.title ?? "";
  const description = row?.description;
  const iconName = getSetTypeIconName(row);

  return (
    <Card padded={false} style={{ overflow: "hidden" }}>
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={[
            hexToRgba(theme.colors.accent, 0.08),
            hexToRgba(theme.colors.accent2, 0.04),
            "rgba(255,255,255,0.00)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={[styles.content, { padding: theme.spacing.md }]}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                },
              ]}
            >
              <Icon
                name={iconName}
                size={22}
                color={theme.colors.accent}
                strokeWidth={2}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text weight="bold" style={{ fontSize: 16 }}>
                {title}
              </Text>
              {description ? (
                <Text
                  muted
                  style={{ fontSize: 13, lineHeight: 18 }}
                  numberOfLines={2}
                >
                  {description}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
