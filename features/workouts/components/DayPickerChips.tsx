import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useTheme, Text } from "@/shared/ui";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

export function DayPickerChips(props: {
  labels: string[];
  activeIndex: number | null;
  onChange: (index: number | null) => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  return (
    <View style={{ paddingTop: 10 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: theme.spacing.lg },
        ]}
      >
        <Pressable
          onPress={() => props.onChange(null)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor:
                props.activeIndex == null
                  ? hexToRgba(theme.colors.accent, 0.18)
                  : theme.colors.surface2,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: props.activeIndex == null ? theme.colors.accent : theme.colors.textMuted,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {t("common.all", "All")}
          </Text>
        </Pressable>

        {props.labels.map((lbl, i) => {
          const isActive = props.activeIndex === i;
          return (
            <Pressable
              key={i}
              onPress={() => props.onChange(i)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isActive
                    ? hexToRgba(theme.colors.accent, 0.18)
                    : theme.colors.surface2,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? theme.colors.accent : theme.colors.textMuted,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {lbl}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});

