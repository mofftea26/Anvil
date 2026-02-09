import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { WorkoutSeries } from "@/features/builder/types";
import { summarizeSets } from "@/features/builder/utils/summarizeSets";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

function tempoText(tempo: any): string {
  const e = String(tempo?.eccentric ?? "—");
  const b = String(tempo?.bottom ?? "—");
  const c = String(tempo?.concentric ?? "—");
  const t = String(tempo?.top ?? "—");
  return `${e}-${b}-${c}-${t}`;
}

export const WorkoutTemplateReadOnly = memo(function WorkoutTemplateReadOnly(props: {
  series: WorkoutSeries[];
}) {
  const theme = useTheme();

  const blocks = useMemo(() => props.series ?? [], [props.series]);

  if (blocks.length === 0) {
    return (
      <Card
        padded
        style={{
          backgroundColor: theme.colors.surface2,
          borderColor: hexToRgba(theme.colors.textMuted, 0.14),
          borderWidth: 1,
          borderRadius: theme.radii.lg,
        }}
      >
        <Text style={{ color: theme.colors.textMuted, textAlign: "center" }}>
          No exercises yet.
        </Text>
      </Card>
    );
  }

  return (
    <VStack style={{ gap: theme.spacing.lg }}>
      {blocks.map((block) => {
        return (
          <Card
            key={block.id}
            padded
            style={[
              styles.blockCard,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: hexToRgba(theme.colors.accent, 0.12),
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            <HStack align="center" justify="space-between" style={{ marginBottom: 12 }}>
              <HStack align="center" gap={10}>
                <View
                  style={[
                    styles.blockLabel,
                    { backgroundColor: hexToRgba(theme.colors.accent, 0.18) },
                  ]}
                >
                  <Text style={{ color: theme.colors.accent, fontWeight: "900" }}>
                    {block.label}
                  </Text>
                </View>
                <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
                  Series {block.label}
                </Text>
              </HStack>

              {block.durationMin ? (
                <HStack align="center" gap={6}>
                  <Icon name="timer-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={{ color: theme.colors.textMuted, fontWeight: "700", fontSize: 12 }}>
                    {block.durationMin} min
                  </Text>
                </HStack>
              ) : null}
            </HStack>

            <VStack style={{ gap: 14 }}>
              {block.exercises.map((ex) => {
                const summary = summarizeSets(ex.sets);
                return (
                  <View
                    key={ex.id}
                    style={[
                      styles.exercise,
                      {
                        backgroundColor: theme.colors.surface3 ?? theme.colors.background,
                        borderColor: hexToRgba(theme.colors.textMuted, 0.14),
                      },
                    ]}
                  >
                    <HStack align="flex-start" justify="space-between" gap={12}>
                      <VStack style={{ flex: 1, minWidth: 0, gap: 6 }}>
                        <Text
                          weight="bold"
                          style={{ color: theme.colors.text, fontSize: 15 }}
                          numberOfLines={2}
                        >
                          {ex.title}
                        </Text>

                        <HStack align="center" gap={8} style={{ flexWrap: "wrap" }}>
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: hexToRgba(theme.colors.accent, 0.14) },
                            ]}
                          >
                            <Icon name="bolt" size={12} color={theme.colors.accent} />
                            <Text
                              style={{
                                color: theme.colors.accent,
                                fontWeight: "800",
                                fontSize: 11,
                              }}
                            >
                              {tempoText(ex.tempo)}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: hexToRgba(theme.colors.textMuted, 0.12) },
                            ]}
                          >
                            <Icon name="layers" size={12} color={theme.colors.textMuted} />
                            <Text
                              style={{
                                color: theme.colors.textMuted,
                                fontWeight: "800",
                                fontSize: 11,
                              }}
                            >
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
                            <Text
                              style={{
                                color: theme.colors.textMuted,
                                fontWeight: "800",
                                fontSize: 11,
                              }}
                            >
                              {summary.repsText} reps
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: hexToRgba(theme.colors.textMuted, 0.12) },
                            ]}
                          >
                            <Icon name="timer-outline" size={12} color={theme.colors.textMuted} />
                            <Text
                              style={{
                                color: theme.colors.textMuted,
                                fontWeight: "800",
                                fontSize: 11,
                              }}
                            >
                              {summary.restText} rest
                            </Text>
                          </View>
                        </HStack>
                      </VStack>
                    </HStack>

                    <View style={[styles.table, { borderTopColor: hexToRgba(theme.colors.textMuted, 0.14) }]}>
                      <HStack style={styles.tableHead} align="center">
                        <Text style={[styles.th, { color: theme.colors.textMuted }]}>Set</Text>
                        <Text style={[styles.th, { color: theme.colors.textMuted }]}>Reps</Text>
                        <Text style={[styles.th, { color: theme.colors.textMuted }]}>Rest</Text>
                      </HStack>

                      {ex.sets.map((s, idx) => (
                        <HStack key={s.id} style={styles.tableRow} align="center">
                          <Text style={[styles.td, { color: theme.colors.text }]}>
                            {idx + 1}
                          </Text>
                          <Text style={[styles.td, { color: theme.colors.text }]}>
                            {String(s.reps || "—")}
                          </Text>
                          <Text style={[styles.td, { color: theme.colors.textMuted }]}>
                            {s.restSec ? `${s.restSec}s` : "—"}
                          </Text>
                        </HStack>
                      ))}
                    </View>
                  </View>
                );
              })}
            </VStack>
          </Card>
        );
      })}
    </VStack>
  );
});

const styles = StyleSheet.create({
  blockCard: { borderWidth: 1 },
  blockLabel: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exercise: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  table: { marginTop: 12, borderTopWidth: 1, paddingTop: 10 },
  tableHead: { paddingBottom: 8 },
  tableRow: { paddingVertical: 6 },
  th: { flex: 1, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  td: { flex: 1, fontSize: 12, fontWeight: "700" },
});

