import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon, Text, useTheme } from "@/shared/ui";

type LibraryCardProps = {
  title: string;
  subtitle: string;
  icon: string;
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
          <Icon name={icon} size={18} color={theme.colors.text} strokeWidth={1.5} />
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 16 }}>{title}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 }}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} strokeWidth={1.5} />
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
