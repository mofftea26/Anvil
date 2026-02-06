import React from "react";
import { StyleSheet, View } from "react-native";

import type { ProgramDifficulty } from "@/features/library/types/programTemplate";
import { DIFFICULTY_ICONS, getDifficultyColors } from "@/features/library/utils/programColors";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

export function ProgramTemplateCardStatsRow(props: {
  difficulty: ProgramDifficulty;
  difficultyLabel: string;
  totalWeeks: number;
  phaseCount: number;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const diffColors = getDifficultyColors(props.difficulty);
  const weeksLabel = t("library.programsScreen.weeks", { count: props.totalWeeks });

  return (
    <View style={styles.statsContainer}>
      <HStack
        align="center"
        justify="flex-start"
        gap={theme.spacing?.md ?? 12}
        style={styles.statsRow}
      >
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: diffColors.bg }]}>
            <Icon
              name={DIFFICULTY_ICONS[props.difficulty]}
              size={16}
              color={diffColors.main}
              strokeWidth={2}
            />
          </View>
          <VStack style={styles.statTextContainer}>
            <Text
              weight="bold"
              style={[styles.statLabel, { color: theme.colors.text, fontSize: 14 }]}
              numberOfLines={1}
            >
              {props.difficultyLabel}
            </Text>
          </VStack>
        </View>

        {props.phaseCount > 0 ? (
          <View style={styles.statItem}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: hexToRgba(theme.colors.accent, 0.15) },
              ]}
            >
              <Icon name="cells" size={16} color={theme.colors.accent} strokeWidth={2} />
            </View>
            <VStack style={styles.statTextContainer}>
              <Text
                weight="bold"
                style={[styles.statLabel, { color: theme.colors.text, fontSize: 14 }]}
                numberOfLines={1}
              >
                {props.phaseCount}{" "}
                {props.phaseCount === 1
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
              { backgroundColor: hexToRgba(theme.colors.accent2, 0.15) },
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
              style={[styles.statLabel, { color: theme.colors.text, fontSize: 14 }]}
              numberOfLines={1}
            >
              {weeksLabel}
            </Text>
          </VStack>
        </View>
      </HStack>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: { paddingTop: 4 },
  statsRow: { flexWrap: "wrap" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statTextContainer: { gap: 2 },
  statLabel: { lineHeight: 18 },
});

