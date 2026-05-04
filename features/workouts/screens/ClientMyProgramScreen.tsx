import React, { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { listClientWorkoutAssignmentsForProgramAssignment } from "@/features/workouts/api/clientWorkouts.api";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { getScreenHorizontalPadding, HStack, Icon, Text, useTheme, VStack, appToast } from "@/shared/ui";

import { useClientProgramAssignments } from "../hooks/useClientProgramAssignments";
import { useActiveProgramDetail } from "../hooks/useProgramProgress";
import { useProgramTemplatesPublicMap } from "../hooks/useProgramTemplatesPublicMap";
import { useWorkoutTemplatesMap } from "../hooks/useWorkoutTemplatesMap";
import type { ClientWorkoutAssignment } from "../types";

function ListSkeleton() {
  const theme = useTheme();
  return (
    <VStack style={{ gap: 12 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 148,
            borderRadius: 18,
            backgroundColor: theme.colors.surface2,
            opacity: 0.6,
          }}
        />
      ))}
    </VStack>
  );
}

export function ClientMyProgramScreen() {
  const theme = useTheme();
  const screenPadding = getScreenHorizontalPadding(theme);
  const { t } = useAppTranslation();
  const clientId = useAppSelector((s) => s.auth.userId ?? "");

  const q = useClientProgramAssignments({ clientId });
  const [activeProgramWorkouts, setActiveProgramWorkouts] = useState<ClientWorkoutAssignment[]>([]);
  const [loadingProgramWorkouts, setLoadingProgramWorkouts] = useState(false);
  const { error, showErrorToast } = q;

  useEffect(() => {
    showErrorToast();
  }, [error, showErrorToast]);

  const activeProgram = useMemo(
    () => q.active.find((x) => String(x.status ?? "") === "active") ?? null,
    [q.active]
  );
  const programTemplateIds = useMemo(
    () => Array.from(new Set(q.items.map((x) => x.programTemplateId))),
    [q.items]
  );
  const { templatesById } = useProgramTemplatesPublicMap(programTemplateIds);
  const activeProgramTemplate = activeProgram
    ? (templatesById[activeProgram.programTemplateId] ?? null)
    : null;

  const dq = useActiveProgramDetail(activeProgram?.id ?? null);

  useEffect(() => {
    if (dq.error) appToast.error(dq.error);
  }, [dq.error]);

  useEffect(() => {
    let cancelled = false;
    async function loadProgramWorkouts() {
      if (!activeProgram?.id || !clientId) {
        setActiveProgramWorkouts([]);
        return;
      }
      setLoadingProgramWorkouts(true);
      try {
        const rows = await listClientWorkoutAssignmentsForProgramAssignment({
          clientId,
          programAssignmentId: activeProgram.id,
        });
        if (!cancelled) setActiveProgramWorkouts(rows);
      } catch {
        if (!cancelled) setActiveProgramWorkouts([]);
      } finally {
        if (!cancelled) setLoadingProgramWorkouts(false);
      }
    }
    void loadProgramWorkouts();
    return () => {
      cancelled = true;
    };
  }, [activeProgram?.id, clientId]);

  const workoutIds = useMemo(
    () => activeProgramWorkouts.map((x) => x.workoutTemplateId).filter(Boolean),
    [activeProgramWorkouts]
  );
  const { templatesById: workoutTemplatesById } = useWorkoutTemplatesMap(workoutIds);

  const detail = dq.detail;
  const displayTitle =
    detail?.title ?? activeProgramTemplate?.title ?? t("clients.program", "Program");
  const displayDescription = detail?.description ?? activeProgramTemplate?.description ?? null;

  const resolvedDifficulty = detail?.difficulty ?? null;
  const completionPercent =
    detail && detail.totalDays > 0
      ? Math.round((detail.completedDays / detail.totalDays) * 100)
      : 0;
  const daysLeft = detail ? detail.pendingDays + detail.missedDays : 0;
  const completedForBar = detail?.completedDays ?? 0;
  const totalForBar = detail?.totalDays ?? 0;

  const progressBarWidth = `${Math.max(0, Math.min(100, completionPercent))}%` as `${number}%`;

  const difficultyLabel = useMemo(() => {
    if (!resolvedDifficulty) return "—";
    const d = resolvedDifficulty.toLowerCase();
    if (d === "beginner") return t("library.programsScreen.difficultyBeginner", "Beginner");
    if (d === "intermediate") return t("library.programsScreen.difficultyIntermediate", "Intermediate");
    if (d === "advanced") return t("library.programsScreen.difficultyAdvanced", "Advanced");
    return resolvedDifficulty;
  }, [resolvedDifficulty, t]);
  const difficultyColor = useMemo(() => {
    const d = (resolvedDifficulty ?? "").toLowerCase();
    if (d === "advanced") return theme.colors.danger;
    if (d === "intermediate") return theme.colors.accent2;
    return theme.colors.accent;
  }, [resolvedDifficulty, theme.colors.accent, theme.colors.accent2, theme.colors.danger]);
  const startDateLabel = useMemo(() => {
    const raw = detail?.startDate ?? activeProgram?.startDate;
    if (!raw) return "—";
    const d = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }, [detail?.startDate, activeProgram?.startDate]);
  const durationWeeksLabel =
    detail?.durationWeeks && detail.durationWeeks > 0
      ? t("client.program.weeks", "{{n}} weeks", { n: String(detail.durationWeeks) })
      : "—";

  const nextWorkout = activeProgramWorkouts.find((x) => String(x.status ?? "") !== "completed") ?? null;

  const [syncRefreshing, setSyncRefreshing] = useState(false);
  const onPullRefresh = async () => {
    setSyncRefreshing(true);
    try {
      await Promise.all([q.onRefresh(), dq.refresh()]);
    } finally {
      setSyncRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      alwaysBounceVertical
      bounces
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: screenPadding,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.lg,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={q.refreshing || syncRefreshing}
          onRefresh={() => void onPullRefresh()}
          tintColor={theme.colors.text}
        />
      }
    >
      {q.loading ? (
        <ListSkeleton />
      ) : !activeProgram ? (
        <View style={[styles.empty, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
          <Text weight="bold" style={{ fontSize: 16 }}>
            {t("client.program.noneTitle", "No programs yet")}
          </Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
            {t("client.program.noneSubtitle", "When your trainer assigns a program, it will show up here.")}
          </Text>
        </View>
      ) : (
        <VStack style={{ gap: 14 }}>
          <View style={[styles.hero, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
            <View style={[styles.heroAccentBar, { backgroundColor: theme.colors.accent }]} />
            <HStack align="center" gap={6} style={{ marginBottom: 6 }}>
              <View style={[styles.liveDot, { backgroundColor: theme.colors.accent }]} />
              <Text
                weight="semibold"
                style={{ color: theme.colors.accent, fontSize: 11, letterSpacing: 0.6 }}
              >
                {t("client.workouts.activeProgram", "ACTIVE PROGRAM")}
              </Text>
            </HStack>
            <Text weight="bold" numberOfLines={2} style={{ fontSize: 26, lineHeight: 32 }}>
              {dq.loading && !detail ? t("common.loading", "Loading…") : displayTitle}
            </Text>
            {displayDescription ? (
              <Text style={{ color: theme.colors.textMuted, lineHeight: 20, marginTop: 6 }} numberOfLines={3}>
                {displayDescription}
              </Text>
            ) : null}

            <HStack gap={8} style={{ marginTop: 14, flexWrap: "wrap" }}>
              <HStack align="center" gap={6} style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.chipDot, { backgroundColor: difficultyColor }]} />
                <Text weight="semibold" style={{ fontSize: 12 }}>{difficultyLabel}</Text>
              </HStack>
              <HStack align="center" gap={6} style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Icon name="timer-outline" size={13} color={theme.colors.textMuted} />
                <Text weight="semibold" style={{ fontSize: 12 }}>{durationWeeksLabel}</Text>
              </HStack>
              <HStack align="center" gap={6} style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Icon name="calendar-03" size={13} color={theme.colors.textMuted} />
                <Text weight="semibold" style={{ fontSize: 12 }}>{startDateLabel}</Text>
              </HStack>
              <HStack align="center" gap={6} style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Icon name="layers-outline" size={13} color={theme.colors.textMuted} />
                <Text weight="semibold" style={{ fontSize: 12 }}>
                  {detail
                    ? t("client.program.totalDaysChip", "{{n}} days", { n: String(detail.totalDays) })
                    : "—"}
                </Text>
              </HStack>
              <HStack align="center" gap={6} style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Icon name="pulse" size={13} color={theme.colors.textMuted} />
                <Text weight="semibold" style={{ fontSize: 12 }}>
                  {detail
                    ? t("client.program.daysLeftChip", "{{n}} left", { n: String(daysLeft) })
                    : "—"}
                </Text>
              </HStack>
            </HStack>

            <View style={{ marginTop: 14 }}>
              <HStack align="center" justify="space-between">
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                  {t("client.program.progressLabel", "Progress")}
                </Text>
                <Text weight="bold" style={{ color: theme.colors.accent, fontSize: 13 }}>
                  {t("client.program.percent", "{{p}}%", { p: String(completionPercent) })}
                </Text>
              </HStack>
              <View style={[styles.progressTrack, { backgroundColor: theme.colors.surface, marginTop: 6 }]}>
                <View style={[styles.progressFill, { width: progressBarWidth, backgroundColor: theme.colors.accent }]} />
              </View>
              <HStack justify="space-between" style={{ marginTop: 6 }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                  {`${completedForBar} / ${totalForBar} ${t("client.program.daysShort", "days")}`}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                  {t("client.program.remainingDays", "{{n}} days left", { n: String(daysLeft) })}
                </Text>
              </HStack>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
            <Text weight="semibold">{t("client.program.planSummary", "Plan summary")}</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={styles.statValue}>{detail ? String(detail.totalDays) : "—"}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {t("client.program.totalDays", "Total days")}
                </Text>
              </View>
              <View style={[styles.summaryTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={styles.statValue}>{detail ? String(detail.workoutDays) : "—"}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {t("client.program.workoutDays", "Workout days")}
                </Text>
              </View>
              <View style={[styles.summaryTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={styles.statValue}>{detail ? String(detail.restDays) : "—"}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {t("client.programProgress.info.restDays", "Rest days")}
                </Text>
              </View>
              <View style={[styles.summaryTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[styles.statValue, { color: theme.colors.accent }]}>{detail ? String(detail.completedDays) : "—"}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {t("client.program.completed", "Completed")}
                </Text>
              </View>
              <View style={[styles.summaryTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={styles.statValue}>{detail ? String(detail.pendingDays) : "—"}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {t("client.programProgress.info.pendingDays", "Pending")}
                </Text>
              </View>
              <View style={[styles.summaryTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={styles.statValue}>{detail ? String(detail.missedDays) : "—"}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {t("client.programProgress.info.missedDays", "Missed")}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
            <Text weight="semibold">{t("client.program.nextWorkout", "Next workout")}</Text>
            {loadingProgramWorkouts ? (
              <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>
                {t("common.loading", "Loading...")}
              </Text>
            ) : nextWorkout ? (
              <Pressable
                onPress={() => router.push(`/(client)/workouts/assigned/${nextWorkout.id}` as any)}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <HStack
                  align="center"
                  justify="space-between"
                  style={[styles.nextWorkoutRow, { backgroundColor: theme.colors.surface }]}
                >
                  <VStack style={{ flex: 1, minWidth: 0 }}>
                    <Text weight="semibold" numberOfLines={1}>
                      {workoutTemplatesById[nextWorkout.workoutTemplateId]?.title ??
                        t("client.program.plannedWorkout", "Planned workout")}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, marginTop: 2 }}>
                      {nextWorkout.scheduledFor}
                    </Text>
                  </VStack>
                  <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </HStack>
              </Pressable>
            ) : (
              <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>
                {t("client.program.noUpcomingWorkout", "No upcoming workouts")}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() =>
              router.push(`/(client)/program/${activeProgram.id}` as Parameters<typeof router.push>[0])
            }
            style={({ pressed }) => [styles.primaryAction, { opacity: pressed ? 0.85 : 1, borderColor: theme.colors.accent }]}
          >
            <HStack align="center" justify="space-between">
              <Text weight="semibold" style={{ color: theme.colors.accent }}>
                {t("client.program.viewSchedule", "View full program schedule")}
              </Text>
              <Icon name="chevron-forward" size={18} color={theme.colors.accent} />
            </HStack>
          </Pressable>

          {q.archived.length > 0 ? (
            <View style={[styles.section, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
              <Text weight="semibold">{t("common.archived", "Archived")}</Text>
              <VStack style={{ marginTop: 10, gap: 8 }}>
                {q.archived.map((a) => {
                  const tpl = templatesById[a.programTemplateId];
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() =>
                        router.push(`/(client)/program/${a.id}` as Parameters<typeof router.push>[0])
                      }
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.84 : 1,
                      })}
                    >
                      <HStack
                        align="center"
                        justify="space-between"
                        style={[styles.archivedRow, { backgroundColor: theme.colors.surface }]}
                      >
                        <VStack style={{ flex: 1, minWidth: 0 }}>
                          <Text numberOfLines={1} weight="semibold">
                            {tpl?.title ?? t("clients.program", "Program")}
                          </Text>
                          <Text style={{ color: theme.colors.textMuted, marginTop: 2 }}>
                            {t("client.program.starts", "Starts {{date}}", {
                              date: a.startDate,
                            })}
                          </Text>
                        </VStack>
                        <Icon name="chevron-forward" size={16} color={theme.colors.textMuted} />
                      </HStack>
                    </Pressable>
                  );
                })}
              </VStack>
            </View>
          ) : null}
        </VStack>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 10, paddingBottom: 28 },
  hero: {
    position: "relative",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: "hidden",
  },
  heroAccentBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    opacity: 0.9,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  summaryTile: {
    flexGrow: 1,
    flexBasis: "30%",
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  nextWorkoutRow: {
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryAction: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  archivedRow: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  empty: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
});

