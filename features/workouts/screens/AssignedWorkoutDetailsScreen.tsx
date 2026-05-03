import React, { useEffect, useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  Chip,
  HStack,
  Icon,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

import { WorkoutTemplateReadOnly } from "../components/WorkoutTemplateReadOnly";
import { useAssignedWorkout } from "../hooks/useAssignedWorkout";
import { useClientProgramAssignments } from "../hooks/useClientProgramAssignments";
import { useProgramTemplatesPublicMap } from "../hooks/useProgramTemplatesPublicMap";
import { formatScheduleTimeLabel } from "../utils/scheduleTime";

export function AssignedWorkoutDetailsScreen(props: { assignmentId: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const clientId = useAppSelector((s) => s.auth.userId ?? "");
  const q = useAssignedWorkout(props.assignmentId);
  const { error, showErrorToast } = q;
  const programAssignments = useClientProgramAssignments({ clientId });
  const programTemplateIds = useMemo(
    () => programAssignments.items.map((x) => x.programTemplateId),
    [programAssignments.items]
  );
  const { templatesById: programTemplatesById } = useProgramTemplatesPublicMap(programTemplateIds);

  useEffect(() => {
    showErrorToast();
  }, [error, showErrorToast]);

  const title = q.template?.title ?? t("client.workouts.workout", "Workout");
  const scheduledLabel = useMemo(() => {
    if (!q.assignment?.scheduledFor) return null;
    return formatShortDate(q.assignment.scheduledFor);
  }, [q.assignment?.scheduledFor]);
  const scheduledTimeLabel = useMemo(
    () => formatScheduleTimeLabel(q.assignment?.scheduledTime),
    [q.assignment?.scheduledTime]
  );
  const sourceLabel = useMemo(
    () =>
      q.assignment?.source === "program" || q.assignment?.programAssignmentId
        ? t("clients.program", "Program")
        : t("clients.manual", "Single"),
    [q.assignment?.programAssignmentId, q.assignment?.source, t]
  );
  const programTitle = useMemo(() => {
    if (!q.assignment?.programAssignmentId) return null;
    const row = programAssignments.items.find((x) => x.id === q.assignment?.programAssignmentId);
    if (!row) return null;
    return (
      programTemplatesById[row.programTemplateId]?.title ??
      t("clients.program", "Program")
    );
  }, [programAssignments.items, programTemplatesById, q.assignment?.programAssignmentId, t]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={title}
        subtitle={
          scheduledLabel
            ? t("client.workouts.scheduledFor", "Scheduled {{d}}", { d: scheduledLabel })
            : t("client.workouts.details", "Workout details")
        }
        showBackButton
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
        alwaysBounceVertical
        bounces
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => void q.refetch()}
            tintColor={theme.colors.text}
          />
        }
      >
        {q.isLoading ? (
          <View
            style={{
              height: 120,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface2,
              opacity: 0.6,
            }}
          />
        ) : !q.assignment ? (
          <View style={[styles.empty, { borderColor: theme.colors.border }]}>
            <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
              {t("client.workouts.notFound", "Workout not found")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              {t(
                "client.workouts.notFoundSubtitle",
                "It may have been removed or is no longer available."
              )}
            </Text>
          </View>
        ) : (
          <>
            <Card style={{ borderRadius: 18 }}>
              <VStack style={{ gap: 10 }}>
                <HStack align="center" justify="space-between">
                  <HStack align="center" gap={8}>
                    <Icon
                      name="calendar-03"
                      size={16}
                      color={theme.colors.textMuted}
                    />
                    <Text style={{ color: theme.colors.textMuted }}>
                      {scheduledLabel ??
                        t("client.workouts.details", "Workout details")}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                      {scheduledTimeLabel}
                    </Text>
                  </HStack>
                  <Chip
                    label={sourceLabel}
                    isActive
                    activeLabelColor={
                      sourceLabel === t("clients.program", "Program")
                        ? theme.colors.accent2
                        : theme.colors.accent
                    }
                  />
                </HStack>
                {programTitle ? (
                  <Text style={{ color: theme.colors.textMuted }}>
                    {t("client.program.assignedProgram", "Program")}: {programTitle}
                  </Text>
                ) : null}
              </VStack>
            </Card>
            {q.template ? (
              <WorkoutTemplateReadOnly series={q.template.state?.series ?? []} />
            ) : (
              <Card style={{ borderRadius: 18 }}>
                <VStack style={{ gap: 8 }}>
                  <Text weight="bold" style={{ fontSize: 16 }}>
                    {t("client.workouts.detailsUnavailableTitle", "Workout details unavailable")}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, lineHeight: 20 }}>
                    {t(
                      "client.workouts.detailsUnavailableBody",
                      "The workout is scheduled, but details are temporarily unavailable. Pull to refresh or try again shortly."
                    )}
                  </Text>
                </VStack>
              </Card>
            )}

            <VStack style={{ gap: 10 }}>
              <Button disabled variant="secondary">
                {t("client.workouts.startComingSoon", "Start workout (coming soon)")}
              </Button>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }}>
                {t(
                  "client.workouts.readOnlyHint",
                  "This workout is read-only. Your trainer controls the template."
                )}
              </Text>
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
});

