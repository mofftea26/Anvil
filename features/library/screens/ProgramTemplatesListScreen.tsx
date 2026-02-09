import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { ProgramTemplateCard } from "@/features/library/components/programs/programsPage/components/ProgramTemplateCard";
import { useProgramTemplatesList } from "@/features/library/components/programs/programsPage/hooks/useProgramTemplatesList";
import { AssignToClientsSheet } from "@/features/clients/components/assignments/AssignToClientsSheet";
import { useProgramAssignmentStats } from "@/features/clients/hooks/assignments/useProgramAssignmentStats";
import {
  DIFFICULTY_ICONS,
  getDifficultyColors,
} from "@/features/library/utils/programColors";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Chip,
  Icon,
  LoadingSpinner,
  StickyHeader,
  Text,
  useAppAlert,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function ProgramTemplatesListScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignItem, setAssignItem] = React.useState<{ id: string; title: string } | null>(null);
  const {
    rows,
    isLoading,
    error,
    refreshing,
    filter,
    setFilter,
    onRefresh,
    onNewProgram,
    onOpenProgram,
    onDuplicate,
    onArchive,
    onUnarchive,
    onDelete,
  } = useProgramTemplatesList();

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const lastEditedLabel = t("library.programsScreen.lastEdited");
  const { assignmentStatsByProgramId } = useProgramAssignmentStats(rows.map((r) => r.id));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("library.programsScreen.title", "Program templates")}
        showBackButton
        rightButton={{
          icon: (
            <Icon
              name="add-circle-outline"
              size={22}
              color={theme.colors.text}
              strokeWidth={1.5}
            />
          ),
          variant: "icon",
          onPress: onNewProgram,
        }}
      />

      {/* Filter chips: All, difficulty, Archived (different color) */}
      <View
        style={[styles.filterRow, { borderBottomColor: theme.colors.border }]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          <Chip
            label={t("library.programsScreen.filterAll", "All")}
            isActive={filter === "all"}
            onPress={() => setFilter("all")}
            style={styles.chip}
          />
          <Chip
            label={t("library.programsScreen.difficultyBeginner", "Beginner")}
            isActive={filter === "beginner"}
            onPress={() => setFilter("beginner")}
            style={styles.chip}
            activeBackgroundColor={getDifficultyColors("beginner").main}
            activeBorderColor={getDifficultyColors("beginner").border}
            activeLabelColor={getDifficultyColors("beginner").textOnMain}
            left={
              <Icon
                name={DIFFICULTY_ICONS.beginner}
                size={16}
                color={
                  filter === "beginner"
                    ? getDifficultyColors("beginner").textOnMain
                    : getDifficultyColors("beginner").main
                }
                strokeWidth={1.5}
              />
            }
          />
          <Chip
            label={t(
              "library.programsScreen.difficultyIntermediate",
              "Intermediate"
            )}
            isActive={filter === "intermediate"}
            onPress={() => setFilter("intermediate")}
            style={styles.chip}
            activeBackgroundColor={getDifficultyColors("intermediate").main}
            activeBorderColor={getDifficultyColors("intermediate").border}
            activeLabelColor={getDifficultyColors("intermediate").textOnMain}
            left={
              <Icon
                name={DIFFICULTY_ICONS.intermediate}
                size={16}
                color={
                  filter === "intermediate"
                    ? getDifficultyColors("intermediate").textOnMain
                    : getDifficultyColors("intermediate").main
                }
                strokeWidth={1.5}
              />
            }
          />
          <Chip
            label={t("library.programsScreen.difficultyAdvanced", "Advanced")}
            isActive={filter === "advanced"}
            onPress={() => setFilter("advanced")}
            style={styles.chip}
            activeBackgroundColor={getDifficultyColors("advanced").main}
            activeBorderColor={getDifficultyColors("advanced").border}
            activeLabelColor={getDifficultyColors("advanced").textOnMain}
            left={
              <Icon
                name={DIFFICULTY_ICONS.advanced}
                size={16}
                color={
                  filter === "advanced"
                    ? getDifficultyColors("advanced").textOnMain
                    : getDifficultyColors("advanced").main
                }
                strokeWidth={1.5}
              />
            }
          />
          <Chip
            label={t("library.programsScreen.filterArchived", "Archived")}
            isActive={filter === "archived"}
            onPress={() => setFilter("archived")}
            style={[
              styles.chip,
              styles.archivedChip,
              {
                backgroundColor:
                  filter === "archived"
                    ? hexToRgba(theme.colors.textMuted, 0.35)
                    : hexToRgba(theme.colors.textMuted, 0.12),
                borderColor:
                  filter === "archived"
                    ? hexToRgba(theme.colors.textMuted, 0.5)
                    : hexToRgba(theme.colors.textMuted, 0.25),
              },
            ]}
          />
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Text style={{ color: theme.colors.danger }}>{error}</Text>
        ) : null}

        {isLoading ? (
          <LoadingSpinner />
        ) : !rows.length ? (
          <View style={[styles.empty, { padding: theme.spacing.xl }]}>
            <Text
              weight="bold"
              style={{
                color: theme.colors.text,
                marginBottom: theme.spacing.sm,
              }}
            >
              {t("library.programsScreen.empty", "No programs yet.")}
            </Text>
            <Text
              style={{
                color: theme.colors.textMuted,
                marginBottom: theme.spacing.md,
              }}
            >
              Create a program template and assign workouts to days.
            </Text>
            <Chip
              label={t("library.programsScreen.newProgram", "New Program")}
              isActive={false}
              onPress={onNewProgram}
            />
          </View>
        ) : (
          <VStack style={{ gap: theme.spacing.md }}>
            {rows.map((template) => (
              <ProgramTemplateCard
                key={template.id}
                template={template}
                lastEditedLabel={lastEditedLabel}
                isArchived={template.isArchived}
                onPress={() => onOpenProgram(template.id)}
                onAssign={() => {
                  setAssignItem({ id: template.id, title: template.title || "Program" });
                  setAssignOpen(true);
                }}
                onDuplicate={() => onDuplicate(template.id)}
                onArchive={() => {
                  alert.confirm({
                    title: t(
                      "library.programsScreen.archiveConfirm",
                      "Archive this program?"
                    ),
                    confirmText: t(
                      "library.programsScreen.menuArchive",
                      "Archive"
                    ),
                    cancelText: t("common.cancel", "Cancel"),
                    onConfirm: () => onArchive(template.id),
                  });
                }}
                onUnarchive={() => {
                  alert.confirm({
                    title: t(
                      "library.programsScreen.unarchiveConfirm",
                      "Unarchive this program?"
                    ),
                    confirmText: t(
                      "library.programsScreen.menuUnarchive",
                      "Unarchive"
                    ),
                    cancelText: t("common.cancel", "Cancel"),
                    onConfirm: () => onUnarchive(template.id),
                  });
                }}
                onDelete={() => {
                  alert.confirm({
                    title: t(
                      "library.programsScreen.deleteConfirm",
                      "Delete this program? This cannot be undone."
                    ),
                    confirmText: t(
                      "library.programsScreen.menuDelete",
                      "Delete"
                    ),
                    cancelText: t("common.cancel", "Cancel"),
                    destructive: true,
                    onConfirm: () => onDelete(template.id),
                  });
                }}
                assignmentStats={assignmentStatsByProgramId[template.id] ?? null}
              />
            ))}
          </VStack>
        )}
      </ScrollView>

      {assignItem ? (
        <AssignToClientsSheet
          visible={assignOpen}
          onClose={() => setAssignOpen(false)}
          mode="program"
          item={assignItem}
        />
      ) : null}
    </View>
  );
}

const styles = {
  filterRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipScroll: {
    flexDirection: "row" as const,
    gap: 8,
    paddingRight: 14,
  },
  chip: {
    marginRight: 0,
  },
  archivedChip: {
    // Distinct style so Archived stands out from difficulty filters
  },
  empty: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
