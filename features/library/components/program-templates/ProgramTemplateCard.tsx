import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import type {
  ProgramDifficulty,
  ProgramTemplate,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { formatShortDate } from "@/features/library/utils/formatShortDate";
import {
  DIFFICULTY_ICONS,
  getDifficultyColors,
} from "@/features/library/utils/programColors";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

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
  onUnarchive: () => void;
  onDelete: () => void;
};

function useProgramStats(template: ProgramTemplate) {
  return useMemo(() => {
    const state: ProgramTemplateState | null = template.state ?? null;
    const difficulty: ProgramDifficulty =
      state?.difficulty ?? template.difficulty;
    const totalWeeks = state?.durationWeeks ?? template.durationWeeks ?? 0;
    const phaseCount = state?.phases?.length ?? 0;
    return { difficulty, totalWeeks, phaseCount };
  }, [template.state, template.difficulty, template.durationWeeks]);
}

export function ProgramTemplateCard({
  template,
  lastEditedLabel,
  isArchived = false,
  onPress,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
}: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const { difficulty, totalWeeks, phaseCount } = useProgramStats(template);
  const difficultyLabel = t(DIFFICULTY_KEYS[difficulty]);
  const diffColors = getDifficultyColors(difficulty);
  const weeksLabel = t("library.programsScreen.weeks", { count: totalWeeks });
  const editedDate = formatShortDate(
    template.lastEditedAt ?? template.updatedAt
  );

  const handleDuplicate = () => {
    setMenuOpen(false);
    onDuplicate();
  };
  const handleArchive = () => {
    setMenuOpen(false);
    onArchive();
  };
  const handleUnarchive = () => {
    setMenuOpen(false);
    onUnarchive();
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
          styles.pressable,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <Card
          padded={false}
          style={[
            styles.card,
            {
              borderRadius: theme.radii?.lg ?? 16,
              borderColor: hexToRgba(theme.colors.accent, 0.15),
            },
          ]}
        >
          <View style={{ position: "relative", overflow: "hidden" }}>
            <LinearGradient
              colors={[
                hexToRgba(theme.colors.accent, 0.16),
                hexToRgba(theme.colors.accent2, 0.08),
                hexToRgba(theme.colors.accent, 0.04),
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <VStack
              style={[styles.content, { padding: theme.spacing?.lg ?? 16 }]}
            >
              {/* Header: title + date left, cog right (like WorkoutCard duration circle) */}
              <HStack
                align="flex-start"
                justify="space-between"
                style={styles.header}
              >
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
                    {template.title}
                  </Text>

                  <View
                    style={[
                      styles.editedRow,
                      {
                        backgroundColor: hexToRgba(
                          theme.colors.textMuted,
                          0.08
                        ),
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
                      {lastEditedLabel} {editedDate}
                    </Text>
                  </View>
                </VStack>

                <HStack align="center" gap={4}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setInfoDialogOpen(true);
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
                      setMenuOpen(true);
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
                  >
                    <Icon name="cog" size={22} color={theme.colors.textMuted} />
                  </Pressable>
                </HStack>
              </HStack>

              {/* Stats row: same pattern as WorkoutCard (icon container + label) */}
              <View style={styles.statsContainer}>
                <HStack
                  align="center"
                  justify="flex-start"
                  gap={theme.spacing?.md ?? 12}
                  style={styles.statsRow}
                >
                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.statIconContainer,
                        {
                          backgroundColor: diffColors.bg,
                        },
                      ]}
                    >
                      <Icon
                        name={DIFFICULTY_ICONS[difficulty]}
                        size={16}
                        color={diffColors.main}
                        strokeWidth={2}
                      />
                    </View>
                    <VStack style={styles.statTextContainer}>
                      <Text
                        weight="bold"
                        style={[
                          styles.statLabel,
                          {
                            color: theme.colors.text,
                            fontSize: 14,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {difficultyLabel}
                      </Text>
                    </VStack>
                  </View>

                  {phaseCount > 0 ? (
                    <View style={styles.statItem}>
                      <View
                        style={[
                          styles.statIconContainer,
                          {
                            backgroundColor: hexToRgba(
                              theme.colors.accent,
                              0.15
                            ),
                          },
                        ]}
                      >
                        <Icon
                          name="cells"
                          size={16}
                          color={theme.colors.accent}
                          strokeWidth={2}
                        />
                      </View>
                      <VStack style={styles.statTextContainer}>
                        <Text
                          weight="bold"
                          style={[
                            styles.statLabel,
                            {
                              color: theme.colors.text,
                              fontSize: 14,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {phaseCount}{" "}
                          {phaseCount === 1
                            ? t("library.programsScreen.phase", "Phase")
                            : t("library.programsScreen.phases", "Phases")}
                        </Text>
                      </VStack>
                    </View>
                  ) : null}

                  <View style={styles.statItem}>
                    <View
                      style={[
                        styles.statIconContainer,
                        {
                          backgroundColor: hexToRgba(
                            theme.colors.accent2,
                            0.15
                          ),
                        },
                      ]}
                    >
                      <Icon
                        name="calendar-03"
                        size={16}
                        color={theme.colors.accent2}
                        strokeWidth={2}
                      />
                    </View>
                    <VStack style={styles.statTextContainer}>
                      <Text
                        weight="bold"
                        style={[
                          styles.statLabel,
                          {
                            color: theme.colors.text,
                            fontSize: 14,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {weeksLabel}
                      </Text>
                    </VStack>
                  </View>
                </HStack>
              </View>
            </VStack>
          </View>
        </Card>
      </Pressable>

      {/* Description info dialog */}
      <Modal visible={infoDialogOpen} transparent animationType="fade">
        <Pressable
          style={[styles.dialogOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={() => setInfoDialogOpen(false)}
        >
          <Pressable
            style={[
              styles.dialogCard,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.dialogHeader,
                {
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.dialogIconWrap,
                  {
                    backgroundColor: hexToRgba(theme.colors.accent, 0.12),
                  },
                ]}
              >
                <Icon
                  name="information-circle-outline"
                  size={28}
                  color={theme.colors.accent}
                />
              </View>
              <Text
                weight="bold"
                style={[styles.dialogTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {template.title}
              </Text>
              <Text
                style={[
                  styles.dialogSubtitle,
                  { color: theme.colors.textMuted },
                ]}
              >
                {t("library.programsScreen.description", "Description")}
              </Text>
            </View>
            <ScrollView
              style={styles.dialogScroll}
              contentContainerStyle={styles.dialogScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  styles.dialogBody,
                  {
                    color: template.description
                      ? theme.colors.text
                      : theme.colors.textMuted,
                    fontSize: 15,
                    lineHeight: 22,
                  },
                ]}
              >
                {template.description ||
                  t(
                    "library.programsScreen.noDescription",
                    "No description added."
                  )}
              </Text>
            </ScrollView>
            <Pressable
              onPress={() => setInfoDialogOpen(false)}
              style={({ pressed }) => [
                styles.dialogCloseBtn,
                {
                  backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                weight="semibold"
                style={[styles.dialogCloseText, { color: theme.colors.accent }]}
              >
                {t("common.close", "Close")}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={menuOpen} transparent animationType="fade">
        <Pressable
          style={[styles.menuOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Pressable
              style={[
                styles.menuItem,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={handleDuplicate}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                {t("library.programsScreen.menuDuplicate")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.menuItem,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={isArchived ? handleUnarchive : handleArchive}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                {isArchived
                  ? t("library.programsScreen.menuUnarchive", "Unarchive")
                  : t("library.programsScreen.menuArchive")}
              </Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Text
                style={[styles.menuItemText, { color: theme.colors.danger }]}
              >
                {t("library.programsScreen.menuDelete")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 2,
  },
  card: {
    overflow: "hidden",
    borderWidth: 0,
  },
  content: {
    gap: 16,
    position: "relative",
  },
  header: {
    gap: 12,
  },
  title: {
    fontWeight: "700",
  },
  editedRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 6,
  },
  editedIcon: {},
  editedText: {
    fontWeight: "500",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: "80%",
  },
  dialogHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  dialogIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 4,
  },
  dialogSubtitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dialogScroll: {
    maxHeight: 280,
  },
  dialogScrollContent: {
    padding: 20,
    paddingTop: 16,
  },
  dialogBody: {
    textAlign: "center",
  },
  dialogCloseBtn: {
    margin: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogCloseText: {
    fontSize: 16,
  },
  statsContainer: {
    paddingTop: 4,
  },
  statsRow: {
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statTextContainer: {
    gap: 2,
  },
  statLabel: {
    lineHeight: 18,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuCard: {
    borderRadius: 14,
    minWidth: 220,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
