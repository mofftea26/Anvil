import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

export function ProgramTemplateCardHeader(props: {
  title: string;
  lastEditedLabel: string;
  editedDate: string;
  onOpenInfo: () => void;
  onOpenMenu: () => void;
  showActions?: boolean;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const showActions = props.showActions !== false;

  return (
    <HStack align="flex-start" justify="space-between" style={styles.header}>
      <VStack style={{ flex: 1, minWidth: 0 }}>
        <Text
          weight="bold"
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: 20,
              lineHeight: 26,
            },
          ]}
          numberOfLines={2}
        >
          {props.title}
        </Text>

        <View
          style={[
            styles.editedRow,
            {
              backgroundColor: hexToRgba(theme.colors.textMuted, 0.08),
              borderRadius: 8,
            },
          ]}
        >
          <Icon
            name="timer-outline"
            size={12}
            color={theme.colors.textMuted}
            style={styles.editedIcon}
          />
          <Text
            style={[
              styles.editedText,
              {
                fontSize: 11,
                color: theme.colors.textMuted,
                letterSpacing: 0.3,
              },
            ]}
            numberOfLines={1}
          >
            {props.lastEditedLabel} {props.editedDate}
          </Text>
        </View>
      </VStack>

      {showActions ? (
        <HStack align="center" gap={4}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            props.onOpenInfo();
          }}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: pressed
                ? hexToRgba(theme.colors.accent, 0.15)
                : "transparent",
            },
          ]}
          hitSlop={12}
          accessibilityLabel={t("common.info", "Info")}
        >
          <Icon
            name="information-circle-outline"
            size={22}
            color={theme.colors.textMuted}
          />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            props.onOpenMenu();
          }}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: pressed
                ? hexToRgba(theme.colors.accent, 0.15)
                : "transparent",
            },
          ]}
          hitSlop={12}
          accessibilityLabel={t("common.menu", "Menu")}
        >
          <Icon name="cog" size={22} color={theme.colors.textMuted} />
        </Pressable>
        </HStack>
      ) : null}
    </HStack>
  );
}

const styles = StyleSheet.create({
  header: {},
  title: {},
  editedRow: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  editedIcon: { marginTop: 0.5 },
  editedText: {},
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
