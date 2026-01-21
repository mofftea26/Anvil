import type { SetTypeRow } from "@/features/library/types/setTypes";
import React from "react";
import { StyleSheet, View } from "react-native";

import { Text, useTheme } from "@/shared/ui";

type SetTypesCardProps = {
  row: SetTypeRow;
};

export function SetTypesCard({ row }: SetTypesCardProps) {
  const theme = useTheme();
  const title = row?.title ?? "";
  const description = row?.description;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={{ fontWeight: "800", fontSize: 16 }}>{title}</Text>
      {description ? (
        <Text style={{ opacity: 0.85, marginTop: 6 }}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
});
