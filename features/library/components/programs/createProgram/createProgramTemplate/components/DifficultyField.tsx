import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { ProgramDifficulty } from "@/features/library/types/programTemplate";
import { PROGRAM_DIFFICULTIES } from "@/features/library/types/programTemplate";
import {
  DIFFICULTY_ICONS,
  getDifficultyColors,
} from "@/features/library/utils/programColors";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

const DIFFICULTY_KEYS: Record<ProgramDifficulty, string> = {
  beginner: "library.programsScreen.difficultyBeginner",
  intermediate: "library.programsScreen.difficultyIntermediate",
  advanced: "library.programsScreen.difficultyAdvanced",
};

export function DifficultyField(props: {
  difficulty: ProgramDifficulty;
  onChangeDifficulty: (d: ProgramDifficulty) => void;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
        {t("library.createProgram.difficultyLabel", "Difficulty")}
      </Text>
      <View style={styles.row}>
        {PROGRAM_DIFFICULTIES.map((d) => {
          const diffColors = getDifficultyColors(d);
          const isSelected = props.difficulty === d;
          return (
            <Pressable
              key={d}
              onPress={() => props.onChangeDifficulty(d)}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? diffColors.bg
                    : theme.colors.background,
                },
              ]}
            >
              <Icon
                name={DIFFICULTY_ICONS[d]}
                size={22}
                color={diffColors.main}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color: isSelected
                      ? theme.colors.text
                      : theme.colors.textMuted,
                  },
                ]}
              >
                {t(DIFFICULTY_KEYS[d])}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  option: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  optionLabel: { fontSize: 12, fontWeight: "600" },
});
