import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { ProgramTemplateCard } from "@/features/library/components/program-templates/ProgramTemplateCard";
import { useProgramTemplatesList } from "@/features/library/hooks/program-templates/useProgramTemplatesList";
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
    onDelete,
  } = useProgramTemplatesList();

  const lastEditedLabel = t("library.programsScreen.lastEdited");

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("library.programsScreen.title", "Program templates")}
        showBackButton
        rightButton={{
          icon: <Icon name="add-circle-outline" size={22} color={theme.colors.text} strokeWidth={1.5} />,
          variant: "icon",
          onPress: onNewProgram,
        }}
      />

      {/* Filter chips */}
      <View style={[styles.filterRow, { borderBottomColor: theme.colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
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
          />
          <Chip
            label={t("library.programsScreen.difficultyIntermediate", "Intermediate")}
            isActive={filter === "intermediate"}
            onPress={() => setFilter("intermediate")}
            style={styles.chip}
          />
          <Chip
            label={t("library.programsScreen.difficultyAdvanced", "Advanced")}
            isActive={filter === "advanced"}
            onPress={() => setFilter("advanced")}
            style={styles.chip}
          />
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={theme.colors.text} />
        }
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}

        {isLoading ? (
          <LoadingSpinner />
        ) : !rows.length ? (
          <View style={[styles.empty, { padding: theme.spacing.xl }]}>
            <Text weight="bold" style={{ color: theme.colors.text, marginBottom: theme.spacing.sm }}>
              {t("library.programsScreen.empty", "No programs yet.")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.md }}>
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
                onPress={() => onOpenProgram(template.id)}
                onDuplicate={() => onDuplicate(template.id)}
                onArchive={() => {
                  alert.confirm({
                    title: t("library.programsScreen.archiveConfirm", "Archive this program?"),
                    confirmText: t("library.programsScreen.menuArchive", "Archive"),
                    cancelText: t("common.cancel", "Cancel"),
                    onConfirm: () => onArchive(template.id),
                  });
                }}
                onDelete={() => {
                  alert.confirm({
                    title: t("library.programsScreen.deleteConfirm", "Delete this program? This cannot be undone."),
                    confirmText: t("library.programsScreen.menuDelete", "Delete"),
                    cancelText: t("common.cancel", "Cancel"),
                    destructive: true,
                    onConfirm: () => onDelete(template.id),
                  });
                }}
              />
            ))}
          </VStack>
        )}
      </ScrollView>
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
  empty: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
};
