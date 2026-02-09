import React, { useEffect, useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Card,
  HStack,
  Icon,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

import { useWorkoutSessionDetails } from "../hooks/useWorkoutSessionDetails";
import { formatDurationSeconds } from "../utils/workoutMetrics";

export function WorkoutSessionDetailsScreen(props: {
  sessionId: string;
  celebrate?: boolean;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const q = useWorkoutSessionDetails(props.sessionId);
  useEffect(() => {
    q.showErrorToast();
  }, [q.error, q.showErrorToast]);

  const title = q.template?.title ?? t("client.workouts.workout", "Workout");
  const dateLabel = useMemo(() => {
    if (!q.session?.startedAt) return null;
    return formatShortDate(q.session.startedAt);
  }, [q.session?.startedAt]);

  const completedSets = useMemo(
    () => q.logs.filter((l) => !!l.completed).length,
    [q.logs]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("client.workouts.sessionDetails", "Session")}
        subtitle={dateLabel ? `${title} · ${dateLabel}` : title}
        showBackButton
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => void q.refetch()}
            tintColor={theme.colors.text}
          />
        }
      >
        {props.celebrate && q.session?.status === "completed" ? (
          <Card
            padded
            style={{
              backgroundColor: hexToRgba(theme.colors.accent, 0.12),
              borderColor: hexToRgba(theme.colors.accent, 0.2),
              borderWidth: 1,
              borderRadius: theme.radii.xl,
            }}
          >
            <HStack align="center" gap={10}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: hexToRgba(theme.colors.accent, 0.2),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="sparkles" size={22} color={theme.colors.accent} />
              </View>
              <VStack style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
                  {t("client.workouts.greatJob", "Great job")}
                </Text>
                <Text style={{ color: theme.colors.textMuted, lineHeight: 18, fontSize: 12 }}>
                  {t("client.workouts.greatJobSub", "Session saved successfully.")}
                </Text>
              </VStack>
            </HStack>
          </Card>
        ) : null}

        {q.isLoading ? (
          <View
            style={{
              height: 140,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface2,
              opacity: 0.6,
            }}
          />
        ) : !q.session ? (
          <View style={[styles.empty, { borderColor: theme.colors.border }]}>
            <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
              {t("client.workouts.sessionNotFound", "Session not found")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              {t(
                "client.workouts.sessionNotFoundSubtitle",
                "It may have been removed or is no longer available."
              )}
            </Text>
          </View>
        ) : (
          <>
            <HStack gap={12} style={{ flexWrap: "wrap" }}>
              <Card
                padded
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderColor: hexToRgba(theme.colors.textMuted, 0.14),
                  },
                ]}
              >
                <HStack align="center" gap={8}>
                  <Icon name="timer-outline" size={18} color={theme.colors.textMuted} />
                  <VStack style={{ gap: 2 }}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 }}>
                      {t("client.workouts.duration", "DURATION")}
                    </Text>
                    <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
                      {formatDurationSeconds(q.session.durationSec ?? 0)}
                    </Text>
                  </VStack>
                </HStack>
              </Card>

              <Card
                padded
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderColor: hexToRgba(theme.colors.textMuted, 0.14),
                  },
                ]}
              >
                <HStack align="center" gap={8}>
                  <Icon name="flash" size={18} color={theme.colors.textMuted} />
                  <VStack style={{ gap: 2 }}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 }}>
                      {t("client.workouts.volume", "VOLUME")}
                    </Text>
                    <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
                      {Math.round(q.volume).toLocaleString()}
                    </Text>
                  </VStack>
                </HStack>
              </Card>

              <Card
                padded
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderColor: hexToRgba(theme.colors.textMuted, 0.14),
                  },
                ]}
              >
                <HStack align="center" gap={8}>
                  <Icon name="checkmark" size={18} color={theme.colors.textMuted} />
                  <VStack style={{ gap: 2 }}>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 }}>
                      {t("client.workouts.setsDone", "SETS DONE")}
                    </Text>
                    <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
                      {completedSets}
                    </Text>
                  </VStack>
                </HStack>
              </Card>
            </HStack>

            <VStack style={{ gap: 14 }}>
              {q.groups.map((g) => (
                <Card
                  key={g.exerciseId}
                  padded
                  style={{
                    backgroundColor: theme.colors.surface2,
                    borderColor: hexToRgba(theme.colors.textMuted, 0.14),
                    borderWidth: 1,
                    borderRadius: theme.radii.lg,
                  }}
                >
                  <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
                    {g.title}
                  </Text>

                  <View
                    style={[
                      styles.table,
                      { borderTopColor: hexToRgba(theme.colors.textMuted, 0.14) },
                    ]}
                  >
                    <HStack style={styles.tableHead} align="center">
                      <Text style={[styles.th, { color: theme.colors.textMuted }]}>Set</Text>
                      <Text style={[styles.th, { color: theme.colors.textMuted }]}>Reps</Text>
                      <Text style={[styles.th, { color: theme.colors.textMuted }]}>Weight</Text>
                      <Text style={[styles.th, { color: theme.colors.textMuted }]}>Done</Text>
                    </HStack>

                    {g.logs.map((l) => (
                      <HStack key={`${g.exerciseId}-${l.setIndex}`} style={styles.tableRow} align="center">
                        <Text style={[styles.td, { color: theme.colors.text }]}>
                          {l.setIndex + 1}
                        </Text>
                        <Text style={[styles.td, { color: theme.colors.text }]}>
                          {typeof l.reps === "number" ? l.reps : "—"}
                        </Text>
                        <Text style={[styles.td, { color: theme.colors.text }]}>
                          {typeof l.weight === "number" ? l.weight : "—"}
                        </Text>
                        <Text style={[styles.td, { color: theme.colors.textMuted }]}>
                          {l.completed ? "✓" : "—"}
                        </Text>
                      </HStack>
                    ))}
                  </View>
                </Card>
              ))}
            </VStack>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  statCard: { borderWidth: 1, borderRadius: 18, flexGrow: 1, minWidth: 160 },
  table: { marginTop: 12, borderTopWidth: 1, paddingTop: 10 },
  tableHead: { paddingBottom: 8 },
  tableRow: { paddingVertical: 6 },
  th: { flex: 1, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  td: { flex: 1, fontSize: 12, fontWeight: "700" },
});

