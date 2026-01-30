import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import type { ProgramDifficulty, ProgramTemplate } from "@/features/library/types/programTemplate";
import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Icon, Text, useTheme } from "@/shared/ui";

const DIFFICULTY_KEYS: Record<ProgramDifficulty, string> = {
  beginner: "library.programsScreen.difficultyBeginner",
  intermediate: "library.programsScreen.difficultyIntermediate",
  advanced: "library.programsScreen.difficultyAdvanced",
};

type Props = {
  template: ProgramTemplate;
  lastEditedLabel: string;
  onPress: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function ProgramTemplateCard({
  template,
  lastEditedLabel,
  onPress,
  onDuplicate,
  onArchive,
  onDelete,
}: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const difficultyLabel = t(DIFFICULTY_KEYS[template.difficulty]);
  const weeks = template.durationWeeks ?? 0;
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
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}>
        <Card
          padded
          style={[
            styles.card,
            {
              borderRadius: theme.radii.lg,
              borderColor: hexToRgba(theme.colors.accent, 0.15),
            },
          ]}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text weight="bold" style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                {template.title}
              </Text>
              <View style={[styles.pillRow, { marginTop: theme.spacing.xs }]}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: hexToRgba(theme.colors.accent2, 0.15),
                      borderColor: hexToRgba(theme.colors.accent2, 0.3),
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: theme.colors.textMuted }]}>
                    {difficultyLabel}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                  {weeksLabel}
                </Text>
              </View>
              <Text style={[styles.meta, { color: theme.colors.textMuted, marginTop: 4 }]}>
                {lastEditedLabel} {editedDate}
              </Text>
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setMenuOpen(true);
              }}
              style={({ pressed }) => [
                styles.menuBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              hitSlop={8}
            >
              <Icon name="ellipsis-vertical" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        </Card>
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
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
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
