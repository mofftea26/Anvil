import type { SetTypeRow } from "@/features/library/types/setTypes";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { SetTypesCard } from "./SetTypesCard";
import { Text } from "@/shared/ui";

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
  if (!rows?.length) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.empty}>
          <Text style={{ opacity: 0.7 }}>{emptyLabel}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {rows.map((row, index) => (
        <SetTypesCard key={getRowKey(row, index)} row={row} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 32,
  },
  empty: {
    paddingVertical: 24,
    alignItems: "center",
  },
});
