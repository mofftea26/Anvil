import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { SeriesExercise } from "@/features/builder/types";
import { summarizeSets } from "@/features/builder/utils/summarizeSets";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

import { WorkoutRunSetRow } from "./WorkoutRunSetRow";

function tempoText(tempo: any): string {
  const e = String(tempo?.eccentric ?? "—");
  const b = String(tempo?.bottom ?? "—");
  const c = String(tempo?.concentric ?? "—");
  const t = String(tempo?.top ?? "—");
  return `${e}-${b}-${c}-${t}`;
}

export const WorkoutRunExerciseCard = memo(function WorkoutRunExerciseCard(props: {
  exercise: SeriesExercise;
  draftsByKey: Record<string, { reps: string; weight: string; completed: boolean; setIndex: number }>;
  onChangeReps: (key: string, v: string) => void;
  onChangeWeight: (key: string, v: string) => void;
  onToggleCompleted: (key: string) => void;
}) {
  const theme = useTheme();

  const summary = useMemo(() => summarizeSets(props.exercise.sets), [props.exercise.sets]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: hexToRgba(theme.colors.textMuted, 0.14),
        },
      ]}
    >
      <VStack style={{ gap: 10 }}>
        <VStack style={{ gap: 6 }}>
          <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
            {props.exercise.title}
          </Text>

          <HStack align="center" gap={8} style={{ flexWrap: "wrap" }}>
            <View
              style={[
                styles.badge,
                { backgroundColor: hexToRgba(theme.colors.accent, 0.14) },
              ]}
            >
              <Icon name="bolt" size={12} color={theme.colors.accent} />
              <Text style={{ color: theme.colors.accent, fontWeight: "800", fontSize: 11 }}>
                {tempoText(props.exercise.tempo)}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: hexToRgba(theme.colors.textMuted, 0.12) },
              ]}
            >
              <Icon name="layers" size={12} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, fontWeight: "800", fontSize: 11 }}>
                {summary.setsCount} sets
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: hexToRgba(theme.colors.textMuted, 0.12) },
              ]}
            >
              <Icon name="repeat" size={12} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, fontWeight: "800", fontSize: 11 }}>
                {summary.repsText} reps
              </Text>
            </View>
          </HStack>
        </VStack>

        <VStack style={{ gap: 10 }}>
          {props.exercise.sets.map((s, setIndex) => {
            const key = `${props.exercise.id}:${setIndex}`;
            const vm = props.draftsByKey[key] ?? {
              setIndex,
              reps: "",
              weight: "",
              completed: false,
            };
            return (
              <WorkoutRunSetRow
                key={s.id}
                setNumber={setIndex + 1}
                reps={vm.reps}
                weight={vm.weight}
                completed={vm.completed}
                onChangeReps={(v) => props.onChangeReps(key, v)}
                onChangeWeight={(v) => props.onChangeWeight(key, v)}
                onToggleCompleted={() => props.onToggleCompleted(key)}
              />
            );
          })}
        </VStack>
      </VStack>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
});

