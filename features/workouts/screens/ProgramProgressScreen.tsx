import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { listClientWorkoutAssignmentsForProgramAssignment } from "@/features/workouts/api/clientWorkouts.api";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, StickyHeader, TabBackgroundGradient, Text, useTheme } from "@/shared/ui";

import { ProgramCalendarGrid } from "../components/program/ProgramCalendarGrid";
import { ProgramInfoSection } from "../components/program/ProgramInfoSection";
import { WorkoutDayModal } from "../components/program/WorkoutDayModal";
import { useProgramProgress } from "../hooks/useProgramProgress";
import type { ProgramProgressDay } from "../types";

function todayYmdUtc(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type ProgramProgressScreenProps = {
  assignmentId: string;
};

export function ProgramProgressScreen(props: ProgramProgressScreenProps) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const clientId = useAppSelector((s) => s.auth.userId ?? "");
  const assignmentId = props.assignmentId.trim();

  const pg = useProgramProgress(assignmentId || null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalDay, setModalDay] = useState<ProgramProgressDay | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dayToAssignmentId, setDayToAssignmentId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pg.error) appToast.error(pg.error);
  }, [pg.error]);

  const loadAssignmentMap = useCallback(async () => {
    if (!clientId || !assignmentId) {
      setDayToAssignmentId({});
      return;
    }
    try {
      const rows = await listClientWorkoutAssignmentsForProgramAssignment({
        clientId,
        programAssignmentId: assignmentId,
      });
      const map: Record<string, string> = {};
      for (const r of rows) {
        const key = r.programDayKey;
        if (key && r.id) map[key] = r.id;
      }
      setDayToAssignmentId(map);
    } catch {
      setDayToAssignmentId({});
    }
  }, [assignmentId, clientId]);

  useEffect(() => {
    void loadAssignmentMap();
  }, [loadAssignmentMap]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([pg.refresh(), loadAssignmentMap()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadAssignmentMap, pg]);

  const todayKey = useMemo(() => todayYmdUtc(), []);

  const programTitle = pg.detail?.title ?? t("clients.program", "Program");

  const openDayModal = useCallback(
    (day: ProgramProgressDay) => {
      if (day.isRest || day.status === "rest") return;
      setModalDay(day);
      setModalOpen(true);
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalDay(null);
  }, []);

  const modalAssignmentId = modalDay ? dayToAssignmentId[modalDay.dayKey] ?? null : null;

  if (!assignmentId) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <TabBackgroundGradient />
        <StickyHeader title={t("client.program.scheduleEmptyTitle", "Schedule unavailable")} showBackButton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={programTitle}
        subtitle={
          pg.detail
            ? t("client.program.starts", "Starts {{date}}", { date: pg.detail.startDate })
            : undefined
        }
        showBackButton
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={theme.colors.text} />
        }
      >
        <ProgramInfoSection detail={pg.detail} loading={pg.loading && !pg.detail} />

        {pg.loading && !pg.days.length ? (
          <Text muted>{t("common.loading", "Loading…")}</Text>
        ) : (
          <ProgramCalendarGrid
            days={pg.days}
            onPressDay={openDayModal}
            highlightDayKey={todayKey}
          />
        )}
      </ScrollView>

      <WorkoutDayModal
        visible={modalOpen}
        onClose={closeModal}
        day={modalDay}
        assignmentId={modalAssignmentId}
        programTitle={programTitle}
      />
    </View>
  );
}
