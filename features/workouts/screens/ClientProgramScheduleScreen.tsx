import React, { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, Card, HStack, Icon, StickyHeader, TabBackgroundGradient, Text, useTheme, VStack } from "@/shared/ui";

import { fetchClientProgramAssignmentById, fetchProgramTemplateByIdPublic, listClientWorkoutAssignmentsForProgramAssignment } from "../api/clientWorkouts.api";
import type { ClientProgramAssignment } from "../types";
import { useWorkoutTemplatesMap } from "../hooks/useWorkoutTemplatesMap";

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
  const [programTitle, setProgramTitle] = useState<string | null>(null);
  const [workoutAssignments, setWorkoutAssignments] = useState<any[]>([]);

  const load = async () => {
    if (!clientId || !props.assignmentId) return;
    try {
      const a = await fetchClientProgramAssignmentById({ assignmentId: props.assignmentId });
      if (!a || a.clientId !== clientId) {
        setAssignment(null);
        setProgramTitle(null);
        setWorkoutAssignments([]);
        return;
      }
      const tpl = await fetchProgramTemplateByIdPublic({ programTemplateId: a.programTemplateId });
      setAssignment(a);
      setProgramTitle(tpl?.title ?? t("clients.program", "Program"));

      const rows = await listClientWorkoutAssignmentsForProgramAssignment({
        clientId,
        programAssignmentId: a.id,
      });
      setWorkoutAssignments(rows);
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

  const workoutTemplateIds = useMemo(() => {
    return workoutAssignments
      .map((x) => String(x?.workoutTemplateId ?? ""))
      .filter(Boolean);
  }, [workoutAssignments]);
  const { templatesById } = useWorkoutTemplatesMap(workoutTemplateIds);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={programTitle ?? t("client.program.schedule", "Program schedule")}
        subtitle={assignment ? t("client.program.starts", "Starts {{date}}", { date: assignment.startDate }) : undefined}
        showBackButton
      />

      <ScrollView
        style={{ flex: 1 }}
        alwaysBounceVertical
        bounces
        contentContainerStyle={{ flexGrow: 1, padding: theme.spacing.lg, gap: 12, paddingBottom: theme.spacing.xl }}
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
        ) : !assignment ? (
          <Card background="surface2" style={styles.empty}>
            <Text weight="bold" style={{ fontSize: 16 }}>
              {t("client.program.scheduleEmptyTitle", "Schedule unavailable")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              {t("client.program.scheduleEmptySubtitle", "We couldn’t load this program schedule.")}
            </Text>
          </Card>
        ) : workoutAssignments.length === 0 ? (
          <Card background="surface2" style={styles.empty}>
            <Text weight="bold" style={{ fontSize: 16 }}>
              {t("client.program.scheduleEmptyTitle", "No workouts scheduled")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              {t(
                "client.program.scheduleEmptySubtitle2",
                "Your coach assigned this program, but no scheduled workouts were generated yet.",
              )}
            </Text>
          </Card>
        ) : (
          <VStack style={{ gap: 10 }}>
            {workoutAssignments.map((wa: any) => {
              const workoutId = String(wa?.workoutTemplateId ?? "");
              const workoutTitle = workoutId ? templatesById[workoutId]?.title : null;
              const dateYmd = String(wa?.scheduledFor ?? "");

              return (
                <Pressable
                  key={String(wa?.id ?? `${workoutId}_${dateYmd}`)}
                  onPress={() => router.push(`/(client)/workouts/assigned/${encodeURIComponent(String(wa?.id ?? ""))}` as any)}
                  style={({ pressed }) => [
                    styles.dayCard,
                    {
                      backgroundColor: theme.colors.surface2,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <HStack align="center" justify="space-between" gap={12}>
                    <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <Text weight="bold" numberOfLines={1} style={{ fontSize: 15 }}>
                        {workoutTitle ?? t("client.program.plannedWorkout", "Planned workout")}
                      </Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                        {dateYmd}
                      </Text>
                    </VStack>

                    <HStack align="center" gap={10}>
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

