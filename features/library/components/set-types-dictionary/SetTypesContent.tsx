import type { SetTypeRow } from "@/features/library/types/setTypes";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { SetTypesCard } from "./SetTypesCard";
import { Card, Icon, Text, useTheme, VStack } from "@/shared/ui";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

type SetTypesContentProps = {
  rows: SetTypeRow[];
  emptyLabel: string;
  getRowKey: (row: SetTypeRow, index: number) => string;
};

export function SetTypesContent({
  rows,
  emptyLabel,
  getRowKey,
}: SetTypesContentProps) {
  const theme = useTheme();

  if (!rows?.length) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <VStack
            style={{
              alignItems: "center",
              gap: theme.spacing.md,
              paddingVertical: theme.spacing.xl,
            }}
          >
            <View
              style={[
                styles.emptyIconContainer,
                {
                  backgroundColor: hexToRgba(theme.colors.accent, 0.1),
                  borderColor: hexToRgba(theme.colors.accent, 0.2),
                },
              ]}
            >
              <Icon
                name="book-outline"
                size={32}
                color={theme.colors.accent}
                strokeWidth={2}
              />
            </View>
            <Text muted style={{ textAlign: "center", fontSize: 14 }}>
              {emptyLabel}
            </Text>
          </VStack>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          padding: theme.spacing.md,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.md,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {rows.map((row, index) => (
        <SetTypesCard key={getRowKey(row, index)} row={row} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
