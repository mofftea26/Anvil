import React, { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import type { ProgramTemplateState } from "@/features/library/types/programTemplate";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, Card, HStack, Icon, StickyHeader, TabBackgroundGradient, Text, useTheme, VStack } from "@/shared/ui";

import { fetchClientProgramAssignmentById, fetchProgramTemplateByIdPublic } from "../api/clientWorkouts.api";
import type { ClientProgramAssignment } from "../types";
import { useWorkoutTemplatesMap } from "../hooks/useWorkoutTemplatesMap";
import { flattenProgramDays, firstWorkoutTemplateId } from "../utils/programSchedule";
import { normalizeCompletedDayKeys } from "../utils/programProgress";

function ymdToUtcNoonMs(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

function addDaysYmd(startYmd: string, days: number): string {
  const ms = ymdToUtcNoonMs(startYmd) + days * 86_400_000;
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function Skeleton() {
  const theme = useTheme();
  return (
    <VStack style={{ gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={{ height: 74, borderRadius: 16, backgroundColor: theme.colors.surface2, opacity: 0.6 }} />
      ))}
    </VStack>
  );
}

export function ClientProgramScheduleScreen(props: { assignmentId: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const clientId = useAppSelector((s) => s.auth.userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignment, setAssignment] = useState<ClientProgramAssignment | null>(null);
  const [program, setProgram] = useState<{ title: string; state: ProgramTemplateState | null } | null>(null);

  const load = async () => {
    if (!clientId || !props.assignmentId) return;
    try {
      const a = await fetchClientProgramAssignmentById({ assignmentId: props.assignmentId });
      if (!a || a.clientId !== clientId) {
        setAssignment(null);
        setProgram(null);
        return;
      }
      const tpl = await fetchProgramTemplateByIdPublic({ programTemplateId: a.programTemplateId });
      const state = (tpl?.state as any) as ProgramTemplateState | null;
      setAssignment(a);
      setProgram({ title: tpl?.title ?? t("clients.program", "Program"), state: state ?? null });
    } catch (e: unknown) {
      appToast.error(e instanceof Error ? e.message : "Failed to load schedule");
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, props.assignmentId]);

  const days = useMemo(() => {
    if (!program?.state || !assignment) return [];
    return flattenProgramDays(program.state).map((d) => ({
      ...d,
      dateYmd: addDaysYmd(assignment.startDate, d.offset),
    }));
  }, [assignment, program?.state]);

  const completedKeys = useMemo(() => normalizeCompletedDayKeys(assignment?.progress ?? null), [assignment?.progress]);
  const completedSet = useMemo(() => new Set(completedKeys), [completedKeys]);

  const workoutTemplateIds = useMemo(
    () => days.map((d) => firstWorkoutTemplateId(d)).filter(Boolean) as string[],
    [days]
  );
  const { templatesById } = useWorkoutTemplatesMap(workoutTemplateIds);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={program?.title ?? t("client.program.schedule", "Program schedule")}
        subtitle={assignment ? t("client.program.starts", "Starts {{date}}", { date: assignment.startDate }) : undefined}
        showBackButton
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: 12, paddingBottom: theme.spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load().finally(() => setRefreshing(false));
            }}
            tintColor={theme.colors.text}
          />
        }
      >
        {loading ? (
          <Skeleton />
        ) : !assignment || !program?.state ? (
          <Card background="surface2" style={styles.empty}>
            <Text weight="bold" style={{ fontSize: 16 }}>
              {t("client.program.scheduleEmptyTitle", "Schedule unavailable")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              {t("client.program.scheduleEmptySubtitle", "We couldn’t load this program schedule.")}
            </Text>
          </Card>
        ) : (
          <VStack style={{ gap: 10 }}>
            {days.map((d) => {
              const isDone = completedSet.has(d.dayKey);
              const workoutId = firstWorkoutTemplateId(d);
              const workoutTitle = workoutId ? templatesById[workoutId]?.title : null;
              const hasWorkout = Boolean(workoutId);

              return (
                <Pressable
                  key={d.dayKey || String(d.offset)}
                  onPress={() =>
                    router.push(
                      `/(client)/workouts/program-assignment/${assignment.id}/day/${encodeURIComponent(d.dayKey)}` as any
                    )
                  }
                  style={({ pressed }) => [
                    styles.dayCard,
                    {
                      backgroundColor: theme.colors.surface2,
                      borderColor: isDone ? theme.colors.accent : theme.colors.border,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <HStack align="center" justify="space-between" gap={12}>
                    <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <Text weight="bold" numberOfLines={1} style={{ fontSize: 15 }}>
                        {t("client.program.weekDay", "Week {{w}} Day {{d}}", {
                          w: String(d.weekIndex1),
                          d: String(d.dayIndex1),
                        })}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                        {hasWorkout
                          ? workoutTitle ?? t("client.program.plannedWorkout", "Planned workout")
                          : t("client.program.restDay", "Rest day")}
                        {" • "}
                        {d.dateYmd}
                      </Text>
                    </VStack>

                    <HStack align="center" gap={10}>
                      {isDone ? (
                        <HStack align="center" gap={6}>
                          <Icon name="checkmark-circle" size={18} color={theme.colors.accent} />
                          <Text style={{ color: theme.colors.accent, fontWeight: "800", fontSize: 12 }}>
                            {t("client.program.done", "Done")}
                          </Text>
                        </HStack>
                      ) : null}
                      <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
                    </HStack>
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dayCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  empty: {
    borderRadius: 18,
    padding: 16,
  },
});

