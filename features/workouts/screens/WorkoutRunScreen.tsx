import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  useAppAlert,
  appToast,
  useTheme,
  VStack,
} from "@/shared/ui";

import { WorkoutRunExerciseCard } from "../components/run/WorkoutRunExerciseCard";
import { useAssignedWorkout } from "../hooks/useAssignedWorkout";
import { useWorkoutRun } from "../hooks/useWorkoutRun";
import { formatDurationSeconds } from "../utils/workoutMetrics";
import type { ClientWorkoutAssignment, WorkoutTemplate } from "../types";

function WorkoutRunLoaded(props: {
  clientId: string;
  assignment: ClientWorkoutAssignment;
  template: WorkoutTemplate;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const alert = useAppAlert();

  const runner = useWorkoutRun({
    clientId: props.clientId,
    assignment: props.assignment,
    template: props.template,
  });

  const [finishing, setFinishing] = useState(false);

  const canFinish = !!runner.session && !runner.isStarting;
  const title = props.template.title ?? t("client.workouts.workout", "Workout");

  const blocks = props.template.state?.series ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={title}
        subtitle={
          runner
            ? t("client.workouts.timer", "Time {{t}}", {
                t: formatDurationSeconds(runner.elapsedSec),
              })
            : t("client.workouts.loading", "Loading…")
        }
        showBackButton
        rightButton={
          runner
            ? {
                label: t("client.workouts.finish", "Finish"),
                onPress: () => {
                  if (!canFinish || finishing) return;
                  alert.confirm({
                    title: t("client.workouts.finishConfirm", "Finish workout?"),
                    message: t(
                      "client.workouts.finishConfirmMessage",
                      "This will save your logs and mark the session completed."
                    ),
                    confirmText: t("client.workouts.finish", "Finish"),
                    cancelText: t("common.cancel", "Cancel"),
                    onConfirm: async () => {
                      setFinishing(true);
                      try {
                        await runner.finish();
                        appToast.success(t("client.workouts.finished", "Finished – saved"));
                        const sessionId = runner.session!.id;
                        router.replace(
                          `/(client)/workouts/sessions/${sessionId}?celebrate=1` as any
                        );
                      } finally {
                        setFinishing(false);
                      }
                    },
                    destructive: false,
                  });
                },
                variant: "primary",
                isLoading: finishing,
              }
            : undefined
        }
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
      >
        {
          <>
            {runner.saveError ? (
              <View style={[styles.saveBanner, { borderColor: theme.colors.danger }]}>
                <Text weight="bold" style={{ color: theme.colors.danger }}>
                  {t("client.workouts.saveError", "Couldn’t save")}
                </Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
                  {runner.saveError}
                </Text>
                <Button
                  variant="secondary"
                  onPress={() => void runner.flush()}
                  style={{ marginTop: 10 }}
                >
                  {t("common.retry", "Retry")}
                </Button>
              </View>
            ) : (
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }}>
                {runner.saving
                  ? t("client.workouts.saving", "Saving…")
                  : t("client.workouts.saved", "All changes saved")}
              </Text>
            )}

            <VStack style={{ gap: 14 }}>
              {blocks.map((block) => (
                <VStack key={block.id} style={{ gap: 12 }}>
                  <Text
                    weight="bold"
                    style={{
                      color: theme.colors.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      fontSize: 11,
                    }}
                  >
                    Series {block.label}
                  </Text>
                  <VStack style={{ gap: 12 }}>
                    {block.exercises.map((ex) => (
                      <WorkoutRunExerciseCard
                        key={ex.id}
                        exercise={ex}
                        draftsByKey={runner.draftsByKey as any}
                        onChangeReps={runner.updateReps}
                        onChangeWeight={runner.updateWeight}
                        onToggleCompleted={runner.toggleCompleted}
                      />
                    ))}
                  </VStack>
                </VStack>
              ))}
            </VStack>

            <Button
              variant="secondary"
              onPress={() => void runner.flush()}
              disabled={runner.saving}
            >
              {t("client.workouts.saveNow", "Save now")}
            </Button>
          </>
        }
      </ScrollView>
    </View>
  );
}

export function WorkoutRunScreen(props: { clientId: string; assignmentId: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const q = useAssignedWorkout(props.assignmentId);

  useEffect(() => {
    q.showErrorToast();
  }, [q.error, q.showErrorToast]);

  if (!q.assignment || !q.template) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <TabBackgroundGradient />
        <StickyHeader
          title={t("client.workouts.workout", "Workout")}
          subtitle={t("client.workouts.loading", "Loading…")}
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
        >
          <View
            style={{
              height: 140,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface2,
              opacity: 0.6,
            }}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <WorkoutRunLoaded
      clientId={props.clientId}
      assignment={q.assignment}
      template={q.template}
    />
  );
}

const styles = StyleSheet.create({
  saveBanner: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
});

