import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { formatShortDate } from "@/features/library/utils/formatShortDate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { fetchWorkoutTemplateById } from "@/features/workouts/api/clientWorkouts.api";
import type { WorkoutTemplate } from "@/features/workouts/types";
import { fetchProgramTemplateById } from "@/features/library/api/programTemplates.api";
import type { ProgramTemplate } from "@/features/library/types/programTemplate";
import { ProgramTemplateCard } from "@/features/library/components/programs/programsPage/components/ProgramTemplateCard";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, HStack, Icon, Text, useTheme, VStack, Button, useAppAlert, appToast } from "@/shared/ui";

import { useClientAssignmentsOverview } from "../../hooks/assignments/useClientAssignmentsOverview";
import { AssignToClientActions } from "./AssignToClientActions";
import { ManageAssignmentSheet } from "./ManageAssignmentSheet";
import {
  deleteClientWorkoutAssignment,
  archiveClientProgramAssignment,
  updateClientProgramAssignmentStartDate,
  updateClientWorkoutAssignmentDate,
} from "../../api/assignments.api";

function ymdToUtcNoonMs(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

function diffDaysYmd(aYmd: string, bYmd: string): number {
  const a = ymdToUtcNoonMs(aYmd);
  const b = ymdToUtcNoonMs(bYmd);
  return Math.floor((a - b) / 86_400_000);
}

function workoutIdForProgramToday(params: {
  state: any;
  startDate: string;
  today: string;
}): string | null {
  const offset = diffDaysYmd(params.today, params.startDate);
  if (!Number.isFinite(offset) || offset < 0) return null;
  let i = 0;
  for (const phase of params.state?.phases ?? []) {
    for (const week of phase.weeks ?? []) {
      for (const day of week.days ?? []) {
        if (i === offset) {
          const refs = Array.isArray(day.workouts) && day.workouts.length ? day.workouts : day.workoutRef ? [day.workoutRef] : [];
          for (const r of refs) {
            if (r && r.source === "workoutsTable" && typeof r.workoutId === "string") return r.workoutId;
          }
          return null;
        }
        i += 1;
      }
    }
  }
  return null;
}

export function ClientAssignedItemsCard(props: { clientId: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const alert = useAppAlert();
  const q = useClientAssignmentsOverview({ clientId: props.clientId });

  useEffect(() => {
    q.showErrorToast();
  }, [q.error, q.showErrorToast]);

  const activeProgram = useMemo(
    () => q.programAssignments.find((p: any) => p?.status === "active") ?? null,
    [q.programAssignments]
  );

  const todayYmd = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const todayWorkout = useMemo(
    () => q.workoutAssignments.find((w) => w.scheduledFor === todayYmd) ?? null,
    [q.workoutAssignments, todayYmd]
  );

  const [programTemplate, setProgramTemplate] = useState<ProgramTemplate | null>(null);
  const [todayWorkoutTemplate, setTodayWorkoutTemplate] = useState<WorkoutTemplate | null>(null);

  const plannedWorkoutId = useMemo(() => {
    if (todayWorkout?.workoutTemplateId) return null;
    if (!activeProgram?.startdate) return null;
    if (!programTemplate?.state) return null;
    return workoutIdForProgramToday({
      state: programTemplate.state as any,
      startDate: activeProgram.startdate,
      today: todayYmd,
    });
  }, [activeProgram?.startdate, programTemplate?.state, todayWorkout?.workoutTemplateId, todayYmd]);

  const [manageOpen, setManageOpen] = useState(false);
  const [manageMode, setManageMode] = useState<"workout" | "program">("workout");
  const [manageTitle, setManageTitle] = useState("");
  const [manageAssignmentId, setManageAssignmentId] = useState("");
  const [manageDateYmd, setManageDateYmd] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (activeProgram?.programtemplateid) {
          const tpl = await fetchProgramTemplateById(activeProgram.programtemplateid);
          if (!cancelled) setProgramTemplate(tpl);
        } else if (!cancelled) {
          setProgramTemplate(null);
        }
      } catch {
        if (!cancelled) setProgramTemplate(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeProgram?.programtemplateid]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const wid = todayWorkout?.workoutTemplateId ?? plannedWorkoutId ?? null;
        if (wid) {
          const row = await fetchWorkoutTemplateById(wid);
          if (!cancelled) setTodayWorkoutTemplate(row);
        } else if (!cancelled) {
          setTodayWorkoutTemplate(null);
        }
      } catch {
        if (!cancelled) setTodayWorkoutTemplate(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [plannedWorkoutId, todayWorkout?.workoutTemplateId]);

  return (
    <>
      <Card>
        <VStack style={{ gap: theme.spacing.md }}>
        <HStack align="center" justify="space-between">
          <HStack align="center" gap={8}>
            <Icon name="calendar-03" size={18} color={theme.colors.textMuted} />
            <Text weight="bold">{t("clients.assignments", "Assignments")}</Text>
          </HStack>
        </HStack>

        {!activeProgram ? (
          <AssignToClientActions
            clientId={props.clientId}
            onAssigned={() => void q.refetch()}
          />
        ) : (
          <Text style={{ color: theme.colors.textMuted, lineHeight: 18, fontSize: 12 }}>
            {t(
              "clients.assignLockedActiveProgram",
              "This client has an active program. Finish or remove it before assigning new items."
            )}
          </Text>
        )}

        {q.loading ? (
          <View
            style={{
              height: 80,
              borderRadius: 14,
              backgroundColor: theme.colors.surface2,
              opacity: 0.6,
            }}
          />
        ) : (
          <>
            <VStack style={{ gap: 14 }}>
              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                }}
              >
                {t("clients.assignedProgram", "Assigned program")}
              </Text>

              {activeProgram && programTemplate ? (
                <>
                  <ProgramTemplateCard
                    template={programTemplate}
                    lastEditedLabel={t("library.programsScreen.lastEdited", "Last edited")}
                    isArchived={programTemplate.isArchived}
                    onPress={() => {}}
                    onDuplicate={() => {}}
                    onArchive={() => {}}
                    onUnarchive={() => {}}
                    onDelete={() => {}}
                    showActions={false}
                    assignmentStats={null}
                  />
                  <HStack gap={10}>
                    <Button
                      variant="secondary"
                      height={40}
                      fullWidth
                      style={{ flex: 1 }}
                      onPress={() => {
                        setManageMode("program");
                        setManageTitle(programTemplate.title);
                        setManageAssignmentId(activeProgram.id);
                        setManageDateYmd(activeProgram.startdate);
                        setManageOpen(true);
                      }}
                    >
                      {t("common.edit", "Edit date")}
                    </Button>
                    <Button
                      height={40}
                      fullWidth
                      style={{ flex: 1 }}
                      onPress={() => {
                        alert.confirm({
                          title: t("clients.unassignConfirm", "Unassign?"),
                          message: t("common.areYouSure", "Are you sure?"),
                          confirmText: t("common.remove", "Remove"),
                          cancelText: t("common.cancel", "Cancel"),
                          destructive: true,
                          onConfirm: async () => {
                            try {
                              await archiveClientProgramAssignment({ assignmentId: activeProgram.id });
                              appToast.success(t("clients.unassigned", "Removed"));
                              await q.refetch();
                            } catch (e: unknown) {
                              const msg = e instanceof Error ? e.message : t("common.error", "Something went wrong");
                              appToast.error(msg);
                            }
                          },
                        });
                      }}
                    >
                      {t("clients.unassign", "Unassign")}
                    </Button>
                  </HStack>
                </>
              ) : (
                <Text style={{ color: theme.colors.textMuted }}>
                  {t("clients.noActiveProgram", "No active program.")}
                </Text>
              )}

              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  marginTop: 6,
                }}
              >
                {t("clients.todaysWorkout", "Today's workout")}
              </Text>

              {todayWorkoutTemplate && (todayWorkout || plannedWorkoutId) ? (
                <>
                  <Card
                    background="surface2"
                    style={{
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: hexToRgba(theme.colors.textMuted, 0.14),
                      backgroundColor: theme.colors.surface2,
                      padding: 14,
                    }}
                  >
                    <HStack align="center" justify="space-between" gap={12}>
                      <HStack align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: theme.colors.surface3,
                            borderWidth: 1,
                            borderColor: hexToRgba(theme.colors.textMuted, 0.14),
                          }}
                        >
                          <Icon name="barbell-outline" size={18} color={theme.colors.textMuted} />
                        </View>
                        <VStack style={{ flex: 1, minWidth: 0, gap: 2 }}>
                          <Text weight="bold" numberOfLines={1} style={{ fontSize: 15 }}>
                            {todayWorkoutTemplate.title || t("builder.workoutDetails.defaultTitle", "Untitled workout")}
                          </Text>
                          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                            {formatShortDate(todayYmd)}
                          </Text>
                        </VStack>
                      </HStack>
                    </HStack>
                  </Card>
                  {todayWorkout ? (
                    <HStack gap={10}>
                      <Button
                        variant="secondary"
                        height={40}
                        fullWidth
                        style={{ flex: 1 }}
                        onPress={() => {
                          setManageMode("workout");
                          setManageTitle(todayWorkoutTemplate.title || "Workout");
                          setManageAssignmentId(todayWorkout.id);
                          setManageDateYmd(todayWorkout.scheduledFor);
                          setManageOpen(true);
                        }}
                      >
                        {t("common.edit", "Edit date")}
                      </Button>
                      <Button
                        height={40}
                        fullWidth
                        style={{ flex: 1 }}
                        onPress={() => {
                          alert.confirm({
                            title: t("clients.unassignConfirm", "Unassign?"),
                            message: t("common.areYouSure", "Are you sure?"),
                            confirmText: t("common.remove", "Remove"),
                            cancelText: t("common.cancel", "Cancel"),
                            destructive: true,
                            onConfirm: async () => {
                              try {
                                await deleteClientWorkoutAssignment({ assignmentId: todayWorkout.id });
                                appToast.success(t("clients.unassigned", "Removed"));
                                await q.refetch();
                              } catch (e: unknown) {
                                const msg = e instanceof Error ? e.message : t("common.error", "Something went wrong");
                                appToast.error(msg);
                              }
                            },
                          });
                        }}
                      >
                        {t("clients.unassign", "Unassign")}
                      </Button>
                    </HStack>
                  ) : (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }}>
                      {t("clients.plannedFromProgram", "Planned from program")}
                    </Text>
                  )}
                </>
              ) : (
                <View
                  style={[
                    styles.row,
                    {
                      borderColor: hexToRgba(theme.colors.textMuted, 0.14),
                      backgroundColor: theme.colors.surface2,
                    },
                  ]}
                >
                  <HStack align="center" gap={10}>
                    <Icon name="moon" size={18} color={theme.colors.textMuted} />
                    <VStack style={{ gap: 2 }}>
                      <Text weight="semibold">{t("clients.rest", "Rest")}</Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                        {formatShortDate(todayYmd)}
                      </Text>
                    </VStack>
                  </HStack>
                </View>
              )}
            </VStack>
          </>
        )}
        </VStack>
      </Card>

      <ManageAssignmentSheet
        visible={manageOpen}
        onClose={() => setManageOpen(false)}
        mode={manageMode}
        title={manageTitle}
        assignmentId={manageAssignmentId}
        currentDateYmd={manageDateYmd}
        onUpdateDate={async (ymd) => {
          if (manageMode === "workout") {
            await updateClientWorkoutAssignmentDate({ assignmentId: manageAssignmentId, scheduledFor: ymd });
          } else {
            await updateClientProgramAssignmentStartDate({ assignmentId: manageAssignmentId, startDate: ymd });
          }
          setManageDateYmd(ymd);
          await q.refetch();
        }}
        showUnassign={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});

