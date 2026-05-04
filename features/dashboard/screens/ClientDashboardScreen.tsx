import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useClientCoach } from "@/features/linking/hooks/client-coach/useClientCoach";
import { LinkedCoachCard } from "@/features/linking/components/client-coach/LinkedCoachCard";
import { hexToRgba } from "@/features/linking/utils/coachFormatting";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useClientProgramAssignments } from "@/features/workouts/hooks/useClientProgramAssignments";
import { useClientWorkoutSchedule } from "@/features/workouts/hooks/useClientWorkoutSchedule";
import { useProgramTemplatesPublicMap } from "@/features/workouts/hooks/useProgramTemplatesPublicMap";
import { useWorkoutTemplatesMap } from "@/features/workouts/hooks/useWorkoutTemplatesMap";
import { formatScheduleTimeLabel } from "@/features/workouts/utils/scheduleTime";
import {
  computeProgressPercent,
  normalizeCompletedDayKeys,
  totalPlannedDayKeys,
} from "@/features/workouts/utils/programProgress";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Card,
  HStack,
  Icon,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  getScreenHorizontalPadding,
  useTheme,
  VStack,
} from "@/shared/ui";

function formatTodayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getGreetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function ActionPill(props: { icon: string; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 56,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface2,
        opacity: pressed ? 0.85 : 1,
        paddingHorizontal: 10,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      })}
    >
      <Icon
        name={props.icon}
        size={20}
        color={theme.colors.text}
        strokeWidth={1.8}
      />
      <Text
        variant="caption"
        weight="semibold"
        numberOfLines={1}
        style={{ fontSize: 11, textAlign: "center" }}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

function HeroCard(props: { firstName: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const greetingKey = getGreetingKey();

  return (
    <Card
      padded={false}
      bordered
      style={{
        overflow: "hidden",
        borderColor: hexToRgba(theme.colors.accent, 0.22),
        backgroundColor: theme.colors.surface2,
      }}
    >
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={[
            hexToRgba(theme.colors.accent, 0.55),
            hexToRgba(theme.colors.accent2, 0.32),
            "rgba(255,255,255,0.00)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
        />
        <VStack style={{ padding: 14, gap: 4 }}>
          <Text variant="caption" muted style={{ fontSize: 11, letterSpacing: 0.4 }}>
            {formatTodayLabel().toUpperCase()}
          </Text>
          <Text weight="bold" numberOfLines={1} style={{ fontSize: 20, lineHeight: 24 }}>
            {props.firstName
              ? t(
                  `client.dashboard.greeting.${greetingKey}Named` as const,
                  greetingKey === "morning"
                    ? "Good morning, {{name}}"
                    : greetingKey === "afternoon"
                      ? "Good afternoon, {{name}}"
                      : "Good evening, {{name}}",
                  { name: props.firstName }
                )
              : t(`client.dashboard.greeting.${greetingKey}` as const)}
          </Text>
          <Text variant="caption" muted numberOfLines={1}>
            {t("client.dashboard.heroTagline")}
          </Text>
        </VStack>
      </View>
    </Card>
  );
}

function TodayWorkoutCard(props: {
  workoutTitle: string | null;
  scheduledTimeLabel: string | null;
  programTitle: string | null;
  isCompleted: boolean;
  onPress: () => void;
  hasWorkout: boolean;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  if (!props.hasWorkout) {
    return (
      <Card
        bordered
        background="surface2"
        style={{
          gap: 10,
          padding: 18,
          minHeight: 152,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: hexToRgba(theme.colors.textMuted, 0.14),
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 2,
          }}
        >
          <Icon name="pause-circle" size={22} color={theme.colors.textMuted} strokeWidth={1.8} />
        </View>
        <Text weight="bold" style={{ fontSize: 19, lineHeight: 24 }}>
          {t("client.dashboard.todayRest")}
        </Text>
        <Text variant="caption" muted numberOfLines={2}>
          {t("client.dashboard.todayRestSubtitle")}
        </Text>
      </Card>
    );
  }

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <Card
        padded={false}
        bordered
        style={{
          overflow: "hidden",
          minHeight: 188,
          borderColor: hexToRgba(theme.colors.accent, 0.32),
          backgroundColor: theme.colors.surface2,
        }}
      >
        <View style={{ position: "relative", minHeight: 188 }}>
          <LinearGradient
            colors={[
              hexToRgba(theme.colors.accent, 0.42),
              hexToRgba(theme.colors.accent2, 0.22),
              "rgba(255,255,255,0.00)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
          />
          <VStack style={{ flex: 1, padding: 18, gap: 12, minHeight: 188 }}>
            <HStack align="center" justify="space-between">
              <HStack align="center" gap={6}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: theme.colors.accent,
                  }}
                />
                <Text
                  weight="semibold"
                  style={{ color: theme.colors.accent, fontSize: 11, letterSpacing: 0.6 }}
                >
                  {props.isCompleted
                    ? t("client.dashboard.todayCompleted")
                    : t("client.dashboard.todayWorkoutLabel")}
                </Text>
              </HStack>
              {props.scheduledTimeLabel ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: hexToRgba(theme.colors.accent, 0.16),
                    borderWidth: 1,
                    borderColor: hexToRgba(theme.colors.accent, 0.3),
                  }}
                >
                  <Text variant="caption" weight="semibold" style={{ color: theme.colors.text, fontSize: 11 }}>
                    {props.scheduledTimeLabel}
                  </Text>
                </View>
              ) : null}
            </HStack>

            <Text weight="bold" numberOfLines={2} style={{ fontSize: 26, lineHeight: 30 }}>
              {props.workoutTitle ?? t("client.dashboard.workoutFallback")}
            </Text>
            {props.programTitle ? (
              <Text variant="caption" muted numberOfLines={1}>
                {props.programTitle}
              </Text>
            ) : null}

            <View style={{ flex: 1, minHeight: 8 }} />

            <HStack align="center" justify="space-between">
              <HStack align="center" gap={6}>
                <Icon
                  name="dumbbell"
                  size={14}
                  color={theme.colors.text}
                  strokeWidth={1.6}
                />
                <Text variant="caption" muted style={{ fontSize: 11 }}>
                  {t("client.dashboard.tapToStart")}
                </Text>
              </HStack>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: theme.colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Icon
                  name="flash"
                  size={15}
                  color={theme.colors.background}
                  strokeWidth={2.2}
                />
                <Text
                  weight="bold"
                  style={{ color: theme.colors.background, fontSize: 14 }}
                >
                  {props.isCompleted
                    ? t("client.dashboard.viewWorkout")
                    : t("client.dashboard.startWorkout")}
                </Text>
              </View>
            </HStack>
          </VStack>
        </View>
      </Card>
    </Pressable>
  );
}

function ActiveProgramProgressCard(props: {
  programTitle: string;
  percent: number;
  weekIndex: number;
  totalWeeks: number;
  assignmentId: string;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const widthPct = Math.max(0, Math.min(100, props.percent));

  return (
    <Pressable
      onPress={() =>
        router.push(
          `/(client)/program/${props.assignmentId}` as Parameters<typeof router.push>[0]
        )
      }
      accessibilityRole="button"
      accessibilityLabel={t("client.dashboard.activeProgramProgressTitle", "Open program progress")}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <Card
        bordered
        background="surface2"
        style={{ padding: 12, gap: 8 }}
      >
        <HStack align="center" justify="space-between" gap={10}>
          <HStack align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                backgroundColor: hexToRgba(theme.colors.accent, 0.18),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="trophy" size={14} color={theme.colors.accent} strokeWidth={2} />
            </View>
            <HStack align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
              <Text weight="semibold" numberOfLines={1} style={{ fontSize: 13, flexShrink: 1 }}>
                {props.programTitle}
              </Text>
              {props.totalWeeks > 0 ? (
                <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 11, flexShrink: 0 }}>
                  {t("client.dashboard.weekOf", "Week {{week}} of {{total}}", {
                    week: String(props.weekIndex),
                    total: String(props.totalWeeks),
                  })}
                </Text>
              ) : (
                <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 11, flexShrink: 0 }}>
                  {t("client.dashboard.programWeekNumber", "Week {{week}}", {
                    week: String(props.weekIndex),
                  })}
                </Text>
              )}
            </HStack>
          </HStack>
          <HStack align="center" gap={4} style={{ flexShrink: 0 }}>
            <Text weight="bold" style={{ color: theme.colors.accent, fontSize: 14 }}>
              {`${widthPct}%`}
            </Text>
            <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </HStack>
        </HStack>
        <View
          style={{
            height: 6,
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: theme.colors.surface,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${widthPct}%`,
              borderRadius: 999,
              backgroundColor: theme.colors.accent,
            }}
          />
        </View>
      </Card>
    </Pressable>
  );
}

export default function ClientDashboardScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const screenPadding = getScreenHorizontalPadding(theme);
  const clientId = useAppSelector((s) => s.auth.userId ?? "");

  const profile = useMyProfile();
  const schedule = useClientWorkoutSchedule({ clientId });
  const programs = useClientProgramAssignments({ clientId });
  const coach = useClientCoach();

  const todayGroup = React.useMemo(
    () => schedule.groups.find((group) => group.dateKey === schedule.todayKey) ?? null,
    [schedule.groups, schedule.todayKey]
  );
  const todayAssignment = todayGroup?.assignments[0] ?? null;
  const isCompleted = String(todayAssignment?.status ?? "") === "completed";

  const workoutTemplateIds = React.useMemo(() => {
    return todayAssignment ? [todayAssignment.workoutTemplateId] : [];
  }, [todayAssignment]);
  const { templatesById: workoutTemplatesById } = useWorkoutTemplatesMap(workoutTemplateIds);

  const activeProgram = React.useMemo(
    () => programs.active.find((item) => String(item.status ?? "") === "active") ?? null,
    [programs.active]
  );
  const programIds = React.useMemo(
    () => (activeProgram ? [activeProgram.programTemplateId] : []),
    [activeProgram]
  );
  const { templatesById: programTemplatesById } = useProgramTemplatesPublicMap(programIds);
  const activeProgramTemplate = activeProgram
    ? programTemplatesById[activeProgram.programTemplateId] ?? null
    : null;

  const programState = (activeProgramTemplate?.state as any) ?? null;
  const totalPlannedDays = React.useMemo(
    () => totalPlannedDayKeys(programState ?? null).length,
    [programState]
  );
  const completedDayKeys = React.useMemo(
    () => normalizeCompletedDayKeys(activeProgram?.progress),
    [activeProgram?.progress]
  );
  const programPercent = React.useMemo(
    () =>
      computeProgressPercent({
        totalPlannedDays,
        completedDays: completedDayKeys.length,
      }),
    [totalPlannedDays, completedDayKeys.length]
  );
  const programWeek = React.useMemo(() => {
    if (!activeProgram?.startDate) return 0;
    const start = new Date(`${activeProgram.startDate}T00:00:00`).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, Math.floor((now - start) / 86400000));
    return Math.floor(diffDays / 7) + 1;
  }, [activeProgram?.startDate]);
  const programTotalWeeks = activeProgramTemplate?.durationWeeks ?? 0;

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async (): Promise<void> => {
    try {
      setRefreshing(true);
      await Promise.all([
        profile.refetch(),
        schedule.onRefresh(),
        programs.onRefresh(),
        coach.onRefresh(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [coach, profile, programs, schedule]);

  const todayWorkoutTitle = todayAssignment
    ? workoutTemplatesById[todayAssignment.workoutTemplateId]?.title ?? null
    : null;
  const scheduledTimeLabel = todayAssignment?.scheduledTime
    ? formatScheduleTimeLabel(todayAssignment.scheduledTime)
    : null;
  const programTitle = activeProgramTemplate?.title ?? null;

  const handleStart = React.useCallback(() => {
    if (!todayAssignment) return;
    if (isCompleted) {
      router.push(
        `/(client)/workouts/assigned/${todayAssignment.id}` as Parameters<typeof router.push>[0]
      );
      return;
    }
    router.push(
      `/(client)/workouts/run/${todayAssignment.id}` as Parameters<typeof router.push>[0]
    );
  }, [isCompleted, todayAssignment]);

  const firstName = profile.me?.firstName?.trim() ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("client.dashboardTitle")}
        subtitle={t("client.dashboardSubtitle")}
        rightButton={{
          onPress: () => void onRefresh(),
          variant: "icon",
          isLoading: refreshing,
          icon: <Icon name="refresh" size={20} color={theme.colors.text} />,
        }}
      />
      <VStack
        style={{
          flex: 1,
          gap: 10,
          paddingHorizontal: screenPadding,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        }}
      >
        <HeroCard firstName={firstName} />

        <TodayWorkoutCard
          workoutTitle={todayWorkoutTitle}
          scheduledTimeLabel={scheduledTimeLabel}
          programTitle={programTitle}
          isCompleted={isCompleted}
          onPress={handleStart}
          hasWorkout={Boolean(todayAssignment)}
        />

        {activeProgram ? (
          <ActiveProgramProgressCard
            programTitle={programTitle ?? t("client.dashboard.programFallback")}
            percent={programPercent}
            weekIndex={programWeek}
            totalWeeks={programTotalWeeks}
            assignmentId={activeProgram.id}
          />
        ) : null}

        <LinkedCoachCard
          coachFirstName={coach.data?.trainer?.firstName ?? null}
          linked={Boolean(coach.data?.trainer)}
          logoUrl={coach.data?.trainerProfile?.logoUrl ?? null}
          brandA={coach.brandA}
          brandB={coach.brandB}
          onPress={() =>
            router.push("/(client)/(tabs)/coach" as Parameters<typeof router.push>[0])
          }
        />

        <HStack gap={10}>
          <ActionPill
            icon="calendar-03"
            label={t("client.dashboard.openWorkouts")}
            onPress={() =>
              router.push(
                "/(client)/(tabs)/workouts?tab=schedule" as Parameters<typeof router.push>[0]
              )
            }
          />
          <ActionPill
            icon="layers-outline"
            label={t("client.dashboard.openProgram")}
            onPress={() =>
              router.push(
                "/(client)/(tabs)/workouts?tab=program" as Parameters<typeof router.push>[0]
              )
            }
          />
        </HStack>
      </VStack>
    </View>
  );
}
