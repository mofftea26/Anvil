import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type {
  ProgramDifficulty,
  ProgramTemplate,
} from "@/features/library/types/programTemplate";
import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, useTheme, VStack } from "@/shared/ui";

import { ProgramTemplateCardHeader } from "./components/ProgramTemplateCardHeader";
import { ProgramTemplateCardInfoModal } from "./components/ProgramTemplateCardInfoModal";
import { ProgramTemplateCardMenuModal } from "./components/ProgramTemplateCardMenuModal";
import { ProgramTemplateCardStatsRow } from "./components/ProgramTemplateCardStatsRow";
import { useProgramTemplateStats } from "./hooks/useProgramTemplateStats";

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
  onAssign?: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  showActions?: boolean;
  assignmentStats?: { doing: number; finished: number } | null;
};

export function ProgramTemplateCard({
  template,
  lastEditedLabel,
  isArchived = false,
  onPress,
  onAssign,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
  showActions = true,
  assignmentStats = null,
}: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const { difficulty, totalWeeks, phaseCount } =
    useProgramTemplateStats(template);
  const difficultyLabel = t(DIFFICULTY_KEYS[difficulty]);
  const editedDate = formatShortDate(
    template.lastEditedAt ?? template.updatedAt
  );

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
              <ProgramTemplateCardHeader
                title={template.title}
                lastEditedLabel={lastEditedLabel}
                editedDate={editedDate}
                onOpenInfo={() => setInfoDialogOpen(true)}
                onOpenMenu={() => setMenuOpen(true)}
                showActions={showActions}
              />

              <ProgramTemplateCardStatsRow
                difficulty={difficulty}
                difficultyLabel={difficultyLabel}
                totalWeeks={totalWeeks}
                phaseCount={phaseCount}
                assignmentStats={assignmentStats}
              />
            </VStack>
          </View>
        </Card>
      </Pressable>

      <ProgramTemplateCardInfoModal
        visible={infoDialogOpen}
        template={template}
        onClose={() => setInfoDialogOpen(false)}
      />

      <ProgramTemplateCardMenuModal
        visible={menuOpen}
        isArchived={isArchived}
        onClose={() => setMenuOpen(false)}
        onAssign={
          showActions && onAssign
            ? () => {
                setMenuOpen(false);
                onAssign();
              }
            : undefined
        }
        onDuplicate={() => {
          setMenuOpen(false);
          onDuplicate();
        }}
        onArchive={() => {
          setMenuOpen(false);
          onArchive();
        }}
        onUnarchive={() => {
          setMenuOpen(false);
          onUnarchive();
        }}
        onDelete={() => {
          setMenuOpen(false);
          onDelete();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pressable: { marginBottom: 2 },
  card: { overflow: "hidden", borderWidth: 0 },
  content: { gap: 16, position: "relative" },
});
