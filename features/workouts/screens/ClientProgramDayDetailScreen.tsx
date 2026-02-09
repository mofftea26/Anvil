import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import type { ProgramTemplateState } from "@/features/library/types/programTemplate";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, Button, Card, Divider, HStack, Icon, StickyHeader, TabBackgroundGradient, Text, useTheme, VStack } from "@/shared/ui";

import {
  fetchClientProgramAssignmentById,
  fetchProgramTemplateByIdPublic,
  fetchWorkoutTemplateById,
  markProgramDayComplete,
  unmarkProgramDayComplete,
} from "../api/clientWorkouts.api";
import type { ClientProgramAssignment } from "../types";
import { WorkoutTemplateReadOnly } from "../components/WorkoutTemplateReadOnly";
import { flattenProgramDays, firstWorkoutTemplateId } from "../utils/programSchedule";
import { normalizeCompletedDayKeys } from "../utils/programProgress";

export function ClientProgramDayDetailScreen(props: { assignmentId: string; dayKey: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const clientId = useAppSelector((s) => s.auth.userId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<ClientProgramAssignment | null>(null);
  const [program, setProgram] = useState<{ title: string; state: ProgramTemplateState | null } | null>(null);
  const [workout, setWorkout] = useState<any | null>(null);

  const load = async () => {
    if (!clientId || !props.assignmentId) return;
    const a = await fetchClientProgramAssignmentById({ assignmentId: props.assignmentId });
    if (!a || a.clientId !== clientId) {
      setAssignment(null);
      setProgram(null);
      setWorkout(null);
      return;
    }
    const tpl = await fetchProgramTemplateByIdPublic({ programTemplateId: a.programTemplateId });
    const state = (tpl?.state as any) as ProgramTemplateState | null;
    setAssignment(a);
    setProgram({ title: tpl?.title ?? t("clients.program", "Program"), state: state ?? null });

    // best-effort: fetch first workout template for the day
    const day = state ? flattenProgramDays(state).find((d) => d.dayKey === props.dayKey) ?? null : null;
    const wid = day ? firstWorkoutTemplateId(day) : null;
    if (wid) {
      const wt = await fetchWorkoutTemplateById(wid);
      setWorkout(wt);
    } else {
      setWorkout(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        await load();
      } catch (e: unknown) {
        appToast.error(e instanceof Error ? e.message : "Failed to load day");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, props.assignmentId, props.dayKey]);

  const dayInfo = useMemo(() => {
    if (!program?.state) return null;
    return flattenProgramDays(program.state).find((d) => d.dayKey === props.dayKey) ?? null;
  }, [program?.state, props.dayKey]);

  const completedSet = useMemo(() => {
    const keys = normalizeCompletedDayKeys(assignment?.progress ?? null);
    return new Set(keys);
  }, [assignment?.progress]);

  const isDone = Boolean(props.dayKey && completedSet.has(props.dayKey));

  const toggleDone = async () => {
    if (!assignment || !props.dayKey || saving) return;
    setSaving(true);
    try {
      // Use backend RPCs for progress mutations.
      const updated = isDone
        ? await unmarkProgramDayComplete({ programAssignmentId: assignment.id, dayKey: props.dayKey })
        : await markProgramDayComplete({ programAssignmentId: assignment.id, dayKey: props.dayKey });
      setAssignment(updated);
      appToast.success(
        isDone
          ? t("client.program.unmarkedDone", "Marked as not done")
          : t("client.program.markedDone", "Marked as done")
      );
    } catch (e: unknown) {
      appToast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={program?.title ?? t("client.program.dayDetail", "Program day")}
        subtitle={
          dayInfo
            ? t("client.program.weekDay", "Week {{w}} Day {{d}}", {
                w: String(dayInfo.weekIndex1),
                d: String(dayInfo.dayIndex1),
              })
            : undefined
        }
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
              load()
                .catch(() => {})
                .finally(() => setRefreshing(false));
            }}
            tintColor={theme.colors.text}
          />
        }
      >
        {loading ? (
          <View style={{ height: 160, borderRadius: 18, backgroundColor: theme.colors.surface2, opacity: 0.6 }} />
        ) : !assignment || !program?.state || !dayInfo ? (
          <Card background="surface2" style={styles.card}>
            <Text weight="bold" style={{ fontSize: 16 }}>
              {t("client.program.dayMissingTitle", "Day not found")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              {t("client.program.dayMissingSubtitle", "We couldn’t load this day from your program.")}
            </Text>
          </Card>
        ) : (
          <>
            <Card background="surface2" style={styles.card}>
              <VStack style={{ gap: 10 }}>
                <HStack align="center" justify="space-between">
                  <VStack style={{ gap: 3, flex: 1, minWidth: 0 }}>
                    <Text muted style={{ fontSize: 12 }}>{t("client.program.day", "Day")}</Text>
                    <Text weight="bold" style={{ fontSize: 18 }}>
                      {t("client.program.weekDay", "Week {{w}} Day {{d}}", {
                        w: String(dayInfo.weekIndex1),
                        d: String(dayInfo.dayIndex1),
                      })}
                    </Text>
                  </VStack>
                  {isDone ? (
                    <HStack align="center" gap={6}>
                      <Icon name="checkmark-circle" size={18} color={theme.colors.accent} />
                      <Text style={{ color: theme.colors.accent, fontWeight: "900", fontSize: 12 }}>
                        {t("client.program.done", "Done")}
                      </Text>
                    </HStack>
                  ) : null}
                </HStack>

                {assignment.notes ? (
                  <>
                    <Divider opacity={0.5} />
                    <Text muted style={{ fontSize: 12 }}>
                      {t("client.program.notes", "Notes")}
                    </Text>
                    <Text style={{ lineHeight: 20 }}>{assignment.notes}</Text>
                  </>
                ) : null}

                <Divider opacity={0.5} />

                <Button
                  onPress={() => void toggleDone()}
                  disabled={saving}
                  isLoading={saving}
                  variant={isDone ? "secondary" : undefined}
                  left={<Icon name={isDone ? "close-circle-outline" : "checkmark"} size={18} color={theme.colors.text} />}
                >
                  {isDone ? t("client.program.unmarkDone", "Mark as not done") : t("client.program.markDone", "Mark as done")}
                </Button>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }}>
                  {t("client.program.markDoneHint", "This updates your program progress only.")}
                </Text>
              </VStack>
            </Card>

            {workout?.state?.series ? (
              <WorkoutTemplateReadOnly series={workout.state.series} />
            ) : (
              <Card background="surface2" style={styles.card}>
                <Text weight="bold">{t("client.program.plannedWorkout", "Planned workout")}</Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
                  {t(
                    "client.program.workoutPlaceholder",
                    "Workout details will appear here when the template is available."
                  )}
                </Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16 },
});

