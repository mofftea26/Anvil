import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text, useTheme } from "@/shared/ui";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type LibraryCardProps = {
  title: string;
  subtitle: string;
  icon: IoniconName;
  onPress: () => void;
};

export function LibraryCard({ title, subtitle, icon, onPress }: LibraryCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.colors.text} />
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 16 }}>{title}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 }}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
