import React from "react";
import { StyleSheet, View } from "react-native";

import type { ProgramDifficulty } from "@/features/library/types/programTemplate";
import { PROGRAM_DIFFICULTIES } from "@/features/library/types/programTemplate";
import {
  DIFFICULTY_ICONS,
  getDifficultyColors,
} from "@/features/library/utils/programColors";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Chip, Icon, useTheme } from "@/shared/ui";

const DIFFICULTY_KEYS: Record<ProgramDifficulty, string> = {
  beginner: "library.programsScreen.difficultyBeginner",
  intermediate: "library.programsScreen.difficultyIntermediate",
  advanced: "library.programsScreen.difficultyAdvanced",
};

export function ProgramTemplateDifficultyRow(props: {
  difficulty: ProgramDifficulty;
  onChange: (d: ProgramDifficulty) => void;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {PROGRAM_DIFFICULTIES.map((d) => {
        const diffColors = getDifficultyColors(d);
        const isActive = props.difficulty === d;
        return (
          <View key={d} style={styles.wrap}>
            <Chip
              label={t(DIFFICULTY_KEYS[d])}
              isActive={isActive}
              onPress={() => props.onChange(d)}
              style={styles.chip}
              activeBackgroundColor={diffColors.main}
              activeBorderColor={diffColors.border}
              activeLabelColor={diffColors.textOnMain}
              left={
                <Icon
                  name={DIFFICULTY_ICONS[d]}
                  size={16}
                  color={isActive ? diffColors.textOnMain : diffColors.main}
                  strokeWidth={1.5}
                />
              }
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
    paddingBottom: 6,
    gap: 8,
  },
  wrap: { flex: 1 },
  chip: {
    marginRight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
