import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

export function WeekSwitcher(props: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: hexToRgba(theme.colors.textMuted, 0.18),
        },
      ]}
    >
      <Pressable
        onPress={props.onPrev}
        hitSlop={10}
        style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.75 : 1 }]}
        accessibilityLabel={t("common.previous", "Previous")}
      >
        <Icon name="chevron-back" size={18} color={theme.colors.text} />
      </Pressable>

      <View style={{ flex: 1, alignItems: "center" }}>
        <Text weight="semibold" style={{ color: theme.colors.text, fontSize: 13 }}>
          {props.label}
        </Text>
        <Pressable
          onPress={props.onToday}
          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
        >
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "700" }}>
            {t("client.workouts.today", "Today")}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={props.onNext}
        hitSlop={10}
        style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.75 : 1 }]}
        accessibilityLabel={t("common.next", "Next")}
      >
        <Icon name="chevron-forward" size={18} color={theme.colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

