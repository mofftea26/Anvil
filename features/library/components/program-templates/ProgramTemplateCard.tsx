import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { ProgramDifficulty, ProgramTemplate } from "@/features/library/types/programTemplate";
import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

const CARD_BORDER_RADIUS = 20;

const DIFFICULTY_KEYS: Record<ProgramDifficulty, string> = {
  beginner: "library.programsScreen.difficultyBeginner",
  intermediate: "library.programsScreen.difficultyIntermediate",
  advanced: "library.programsScreen.difficultyAdvanced",
};

type Props = {
  template: ProgramTemplate;
  lastEditedLabel: string;
  isArchived?: boolean;
  onPress: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function ProgramTemplateCard({
  template,
  lastEditedLabel,
  isArchived = false,
  onPress,
  onDuplicate,
  onArchive,
  onDelete,
}: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const difficultyLabel = t(DIFFICULTY_KEYS[template.difficulty]);
  const weeks = template.durationWeeks ?? template.state?.durationWeeks ?? 0;
  const weeksLabel = t("library.programsScreen.weeks", { count: weeks });
  const editedDate = formatShortDate(template.lastEditedAt ?? template.updatedAt);

  const handleDuplicate = () => {
    setMenuOpen(false);
    onDuplicate();
  };

  const handleArchive = () => {
    setMenuOpen(false);
    onArchive();
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete();
  };

  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.wrapper,
          { opacity: pressed ? 0.97 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
        ]}
      >
        <View style={[styles.card, { borderRadius: CARD_BORDER_RADIUS, overflow: "hidden" }]}>
          <LinearGradient
            colors={[
              hexToRgba(theme.colors.accent, 0.14),
              hexToRgba(theme.colors.accent2, 0.08),
              hexToRgba(theme.colors.accent, 0.03),
              theme.colors.surface2,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.borderWrap, { borderColor: hexToRgba(theme.colors.accent, 0.18) }]}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: hexToRgba(theme.colors.accent, 0.22) }]}>
                <Icon name="calendar-outline" size={26} color={theme.colors.accent} />
              </View>
              <View style={styles.content}>
                <Text weight="bold" style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                  {template.title}
                </Text>
                <View style={styles.pillRow}>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: hexToRgba(theme.colors.accent2, 0.22),
                        borderColor: hexToRgba(theme.colors.accent2, 0.35),
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: theme.colors.text }]}>
                      {difficultyLabel}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: hexToRgba(theme.colors.text, 0.08),
                        borderColor: hexToRgba(theme.colors.text, 0.15),
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: theme.colors.textMuted }]}>
                      {weeksLabel}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                  {lastEditedLabel} {editedDate}
                </Text>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setMenuOpen(true);
                }}
                style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.7 : 1 }]}
                hitSlop={8}
              >
                <Icon name="ellipsis-vertical" size={20} color={theme.colors.textMuted} />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>

      <Modal visible={menuOpen} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuCard, { backgroundColor: theme.colors.surface2 }]}>
            <Pressable style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={handleDuplicate}>
              <Text style={{ color: theme.colors.text }}>{t("library.programsScreen.menuDuplicate")}</Text>
            </Pressable>
            <Pressable style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={handleArchive}>
              <Text style={{ color: theme.colors.text }}>{t("library.programsScreen.menuArchive")}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Text style={{ color: theme.colors.danger }}>{t("library.programsScreen.menuDelete")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: "transparent",
  },
  borderWrap: {
    borderWidth: 1,
    borderRadius: CARD_BORDER_RADIUS - 1,
    margin: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 18,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 19,
    lineHeight: 25,
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  menuBtn: {
    padding: 8,
    marginRight: -8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuCard: {
    borderRadius: 16,
    minWidth: 200,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
});
