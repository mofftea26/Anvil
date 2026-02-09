import React, { useEffect, useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

import { WorkoutTemplateReadOnly } from "../components/WorkoutTemplateReadOnly";
import { useAssignedWorkout } from "../hooks/useAssignedWorkout";

export function AssignedWorkoutDetailsScreen(props: { assignmentId: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const q = useAssignedWorkout(props.assignmentId);

  useEffect(() => {
    q.showErrorToast();
  }, [q.error, q.showErrorToast]);

  const title = q.template?.title ?? t("client.workouts.workout", "Workout");
  const scheduledLabel = useMemo(() => {
    if (!q.assignment?.scheduledFor) return null;
    return formatShortDate(q.assignment.scheduledFor);
  }, [q.assignment?.scheduledFor]);

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
        {q.isLoading ? (
          <View
            style={{
              height: 120,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.colors.surface2,
              opacity: 0.6,
            }}
          />
        ) : !q.assignment || !q.template ? (
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
            <WorkoutTemplateReadOnly series={q.template.state?.series ?? []} />

            <VStack style={{ gap: 10 }}>
              <Button
                onPress={() =>
                  router.push(
                    `/(client)/workouts/run/${q.assignment!.id}` as Parameters<
                      typeof router.push
                    >[0]
                  )
                }
              >
                {t("client.workouts.start", "Start workout")}
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

