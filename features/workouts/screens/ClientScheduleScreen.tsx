import React, { useEffect, useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Text, useTheme, VStack } from "@/shared/ui";

import { AssignedWorkoutCard } from "../components/AssignedWorkoutCard";
import { DayPickerChips } from "../components/DayPickerChips";
import { WeekSwitcher } from "../components/WeekSwitcher";
import { useClientWorkoutSchedule } from "../hooks/useClientWorkoutSchedule";
import { useWorkoutTemplatesMap } from "../hooks/useWorkoutTemplatesMap";

function ScheduleSkeleton() {
  const theme = useTheme();
  return (
    <VStack style={{ gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 84,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surface2,
            opacity: 0.6,
          }}
        />
      ))}
    </VStack>
  );
}

export function ClientScheduleScreen(props: { clientId: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const schedule = useClientWorkoutSchedule({ clientId: props.clientId });

  useEffect(() => {
    schedule.showErrorToast();
  }, [schedule.error, schedule.showErrorToast]);

  const templateIds = useMemo(
    () =>
      schedule.visibleGroups.flatMap((g) =>
        g.assignments.map((a) => a.workoutTemplateId)
      ),
    [schedule.visibleGroups]
  );
  const { templatesById } = useWorkoutTemplatesMap(templateIds);

  const dayChipLabels = useMemo(
    () => schedule.groups.map((g) => g.label.split(",")[0] ?? g.label),
    [schedule.groups]
  );

  const hasAny = schedule.visibleGroups.some((g) => g.assignments.length > 0);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <WeekSwitcher
          label={schedule.weekLabel}
          onPrev={schedule.goPrevWeek}
          onNext={schedule.goNextWeek}
          onToday={schedule.goToday}
        />
      </View>

      <DayPickerChips
        labels={dayChipLabels}
        activeIndex={schedule.selectedDayIndex}
        onChange={schedule.setSelectedDayIndex}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={schedule.refreshing}
            onRefresh={() => void schedule.onRefresh()}
            tintColor={theme.colors.text}
          />
        }
      >
        {schedule.isLoading ? (
          <ScheduleSkeleton />
        ) : !hasAny ? (
          <View style={[styles.empty, { borderColor: theme.colors.border }]}>
            <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
              {t("client.workouts.emptyTitle", "No workouts scheduled")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 6, lineHeight: 20 }}>
              {t(
                "client.workouts.emptySubtitle",
                "When your trainer assigns workouts, you’ll see them here."
              )}
            </Text>
          </View>
        ) : (
          schedule.visibleGroups
            .filter((g) => g.assignments.length > 0)
            .map((g) => (
              <VStack key={g.dateKey} style={{ gap: 12 }}>
                <Text
                  weight="semibold"
                  style={{
                    color: theme.colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    fontSize: 11,
                  }}
                >
                  {g.label}
                </Text>

                <VStack style={{ gap: 12 }}>
                  {g.assignments.map((a) => (
                    <AssignedWorkoutCard
                      key={a.id}
                      assignment={a}
                      template={templatesById[a.workoutTemplateId] ?? null}
                      onPress={() =>
                        router.push(`/(client)/workouts/assigned/${a.id}` as any)
                      }
                    />
                  ))}
                </VStack>
              </VStack>
            ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22 },
  empty: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
});

