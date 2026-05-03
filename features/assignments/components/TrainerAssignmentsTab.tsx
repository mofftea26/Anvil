import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ChooseProgramTemplateSheet } from "@/features/clients/components/assignments/ChooseProgramTemplateSheet";
import { ChooseWorkoutTemplateSheet } from "@/features/clients/components/assignments/ChooseWorkoutTemplateSheet";
import { ProgramAssignmentDuplicateModal } from "@/features/clients/components/assignments/ProgramAssignmentDuplicateModal";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  Button,
  Card,
  HStack,
  Chip,
  Icon,
  LoadingSpinner,
  ProgressBar,
  Text,
  useAppAlert,
  useTheme,
  VStack,
} from "@/shared/ui";

import { ManageAssignmentSheet } from "@/features/clients/components/assignments/ManageAssignmentSheet";
import {
  anvilAssignProgramToClient,
  assignClientWorkout,
  fetchProgramAssignmentByUniqueKey,
  generateProgramWorkoutAssignments,
  listWorkoutAssignmentsForClientOnDate,
  resetClientProgramAssignmentProgress,
  reactivateClientProgramAssignment,
  unassignProgramFromClient,
  unassignWorkoutFromClient,
  updateProgramAssignmentStartDate,
  updateWorkoutAssignmentDate,
} from "../api/assignmentsApi";
import { useClientAssignments } from "../hooks/useClientAssignments";
import { DEFAULT_SCHEDULE_TIME, normalizeScheduleTime } from "@/features/workouts/utils/scheduleTime";

function toYmd(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TrainerAssignmentsTab(props: { clientId: string }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const alert = useAppAlert();
  const trainerId = useAppSelector((s) => s.auth.userId ?? "");

  const q = useClientAssignments({ trainerId, clientId: props.clientId });

  const [chooseProgramOpen, setChooseProgramOpen] = useState(false);
  const [chooseWorkoutOpen, setChooseWorkoutOpen] = useState(false);

  const [programToAssign, setProgramToAssign] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [workoutToAssign, setWorkoutToAssign] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [startDate, setStartDate] = useState(() => new Date());
  const [scheduledDate, setScheduledDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState<
    "program" | "workout" | null
  >(null);
  const [saving, setSaving] = useState(false);

  const dupDateLabel = useMemo(
    () =>
      startDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [startDate],
  );

  const [dupOpen, setDupOpen] = useState(false);
  const [dupExisting, setDupExisting] = useState<any | null>(null);
  const dupMode =
    String(dupExisting?.status ?? "") === "archived" ? "archived" : "active";

  const assignProgram = async (startYmdOverride?: string) => {
    if (!programToAssign) return;
    if (saving) return;
    setSaving(true);
    const startYmd = startYmdOverride ?? toYmd(startDate);
    try {
      const inserted = await anvilAssignProgramToClient({
        clientId: props.clientId,
        programTemplateId: programToAssign.id,
        startDate: startYmd,
        notes: null,
      });
      appToast.success(t("clients.assign.assignedProgram", "Program assigned"));
      try {
        await generateProgramWorkoutAssignments({
          programAssignmentId: inserted.id,
          replaceExisting: true,
        });
      } catch {
        appToast.warn(
          t(
            "clients.assign.scheduleGenerationFailed",
            "Assigned, but schedule generation failed",
          ),
        );
      }
      setProgramToAssign(null);
      await q.refetch().catch(() => {});
    } catch (e: any) {
      const httpStatus = Number(e?.status ?? e?.statusCode ?? NaN);
      const pgCode = String(e?.code ?? "");
      const isDup = httpStatus === 409 || pgCode === "23505";
      if (isDup) {
        const existing = await fetchProgramAssignmentByUniqueKey({
          clientId: props.clientId,
          programTemplateId: programToAssign.id,
          startDate: startYmd,
        });
        if (!existing) {
          appToast.error(t("common.error", "Something went wrong"));
        } else {
          setDupExisting(existing);
          setDupOpen(true);
        }
      } else {
        appToast.error(e instanceof Error ? e.message : "Assignment failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const assignWorkout = async (scheduledForOverride?: string) => {
    if (!workoutToAssign) return;
    if (saving) return;
    setSaving(true);
    const ymd = scheduledForOverride ?? toYmd(scheduledDate);
    const slotTime = DEFAULT_SCHEDULE_TIME;
    try {
      const overlaps = await listWorkoutAssignmentsForClientOnDate({
        trainerId,
        clientId: props.clientId,
        ymd,
      });
      const hasRealOverlap =
        overlaps.length > 0 &&
        overlaps.some(
          (x) =>
            normalizeScheduleTime(x.scheduledtime) === slotTime &&
            (x.workoutid !== workoutToAssign.id ||
              x.programassignmentid != null ||
              x.source === "program")
        );
      let overwriteExisting = false;

      if (hasRealOverlap) {
        const overlapKind =
          overlaps.some((x) => x.programassignmentid != null || x.source === "program")
            ? t("clients.program", "program")
            : t("clients.assign.workoutLabel", "workout");

        const confirmed = await new Promise<boolean>((resolve) => {
          alert.show({
            title: t("clients.assign.overwriteTitle", "Workout already scheduled"),
            message: t(
              "clients.assign.overwriteMessageSingle",
              "This client already has a {{kind}} on {{date}}. Overwrite only this day with the selected single workout?",
              { kind: overlapKind, date: ymd }
            ),
            buttons: [
              {
                text: t("common.cancel", "Cancel"),
                variant: "secondary",
                onPress: () => resolve(false),
              },
              {
                text: t("common.overwrite", "Overwrite"),
                variant: "destructive",
                onPress: () => resolve(true),
              },
            ],
          });
        });

        if (!confirmed) return;
        overwriteExisting = true;
      }

      await assignClientWorkout({
        clientId: props.clientId,
        workoutId: workoutToAssign.id,
        scheduledFor: ymd,
        scheduledTime: slotTime,
        overwriteExisting,
      });
      appToast.success(t("clients.assign.assignedWorkout", "Workout assigned"));
      setWorkoutToAssign(null);
      await q.refetch().catch(() => {});
    } catch (e: unknown) {
      appToast.error(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setSaving(false);
    }
  };

  const [manageOpen, setManageOpen] = useState(false);
  const [manageMode, setManageMode] = useState<"program" | "workout">(
    "workout",
  );
  const [manageAssignmentId, setManageAssignmentId] = useState("");
  const [manageTitle, setManageTitle] = useState("");
  const [manageDateYmd, setManageDateYmd] = useState("");

  return (
    <>
      <VStack style={{ gap: theme.spacing.lg }}>
        {q.error ? (
          <Text color={theme.colors.danger}>{q.error}</Text>
        ) : null}

        {q.loading ? <LoadingSpinner /> : null}

        <VStack style={{ gap: 12 }}>
          <HStack align="center" justify="space-between">
            <HStack align="center" gap={8}>
              <Icon name="layers-outline" size={18} color={theme.colors.textMuted} />
              <VStack style={{ gap: 2 }}>
                <Text weight="bold">{t("clients.assignedProgram", "Programs")}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                  {t("clients.assignments.programHint", "Assign or manage program assignments.")}
                </Text>
              </VStack>
            </HStack>

            <Button
              height={38}
              style={{ borderRadius: 999, paddingHorizontal: 14 }}
              textStyle={{ fontSize: 13 }}
              left={
                <Icon
                  name="add-circle-outline"
                  size={18}
                  color={theme.colors.background}
                />
              }
              onPress={() => setChooseProgramOpen(true)}
            >
              {t("clients.assign", "Assign")}
            </Button>
          </HStack>

          {q.programCards.length === 0 ? (
            <Card bordered background="surface2" style={styles.emptyCard}>
              <Text style={{ color: theme.colors.textMuted, textAlign: "center" }}>
                {t("clients.noActiveProgram", "No program assignments.")}
              </Text>
            </Card>
          ) : (
            <VStack style={{ gap: 12 }}>
              {q.programCards.map((p) => {
                const status = String(p.row.status ?? "");
                const isArchived = status === "archived";
                const label = isArchived ? t("common.archived", "Archived") : t("common.active", "Active");
                const accent = isArchived ? theme.colors.textMuted : theme.colors.accent;
                const progress =
                  p.progress.totalDays > 0 ? p.progress.completed / p.progress.totalDays : 0;

                return (
                  <Card key={p.row.id} bordered background="surface2" style={styles.assignmentCard}>
                    <VStack style={{ gap: 12 }}>
                      <HStack align="center" justify="space-between">
                        <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                          <Text weight="bold" numberOfLines={2} style={{ fontSize: 16 }}>
                            {p.template?.title ?? "Program"}
                          </Text>
                          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={2}>
                            {t("client.program.starts", "Starts {{date}}", { date: p.row.startdate })}
                            {" • "}
                            {t("client.program.progressLabel", "{{x}} / {{y}} days", {
                              x: String(p.progress.completed),
                              y: String(p.progress.totalDays),
                            })}
                          </Text>
                        </VStack>

                        <Chip
                          label={label}
                          isActive
                          activeBackgroundColor={hexToRgba(accent, 0.16)}
                          activeBorderColor={hexToRgba(accent, 0.28)}
                          activeLabelColor={accent}
                        />
                      </HStack>

                      <VStack style={{ gap: 8 }}>
                        <ProgressBar progress={progress} />
                        <HStack align="center" justify="space-between">
                          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                            {t("client.program.percent", "{{p}}%", { p: String(p.progress.percent) })}
                          </Text>
                          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                            {t("common.id", "ID")}: {p.row.id.slice(0, 8)}
                          </Text>
                        </HStack>
                      </VStack>

                      <HStack gap={10}>
                        <Button
                          variant="secondary"
                          height={40}
                          fullWidth
                          style={{ flex: 1 }}
                          onPress={() => {
                            setManageMode("program");
                            setManageAssignmentId(p.row.id);
                            setManageTitle(p.template?.title ?? "Program");
                            setManageDateYmd(p.row.startdate);
                            setManageOpen(true);
                          }}
                        >
                          {t("common.edit", "Edit")}
                        </Button>

                        <Button
                          variant="secondary"
                          height={40}
                          fullWidth
                          style={{ flex: 1 }}
                          onPress={() =>
                            alert.confirm({
                              title: t("clients.resetProgress", "Reset progress?"),
                              message: t("common.areYouSure", "Are you sure?"),
                              confirmText: t("common.reset", "Reset"),
                              cancelText: t("common.cancel", "Cancel"),
                              onConfirm: async () => {
                                await resetClientProgramAssignmentProgress({ assignmentId: p.row.id });
                                appToast.success(t("clients.assign.duplicate.resetDone", "Progress reset"));
                                await q.refetch();
                              },
                            })
                          }
                        >
                          {t("clients.resetProgress", "Reset")}
                        </Button>

                        <Button
                          variant="ghost"
                          height={40}
                          fullWidth
                          style={{ flex: 1 }}
                          textStyle={{ color: theme.colors.danger }}
                          onPress={() =>
                            alert.confirm({
                              title: t("clients.unassignConfirm", "Remove assignment?"),
                              message: t("common.areYouSure", "Are you sure?"),
                              confirmText: t("common.remove", "Remove"),
                              cancelText: t("common.cancel", "Cancel"),
                              destructive: true,
                              onConfirm: async () => {
                                await unassignProgramFromClient({ assignmentId: p.row.id });
                                appToast.success(t("clients.unassigned", "Removed"));
                                await q.refetch();
                              },
                            })
                          }
                        >
                          {t("common.remove", "Remove")}
                        </Button>
                      </HStack>
                    </VStack>
                  </Card>
                );
              })}
            </VStack>
          )}
        </VStack>

        <VStack style={{ gap: 12 }}>
          <HStack align="center" justify="space-between">
            <HStack align="center" gap={8}>
              <Icon name="barbell-outline" size={18} color={theme.colors.textMuted} />
              <VStack style={{ gap: 2 }}>
                <Text weight="bold">{t("clients.assign.workoutLabel", "Workouts")}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                  {t("clients.assignments.workoutHint", "Single workouts assigned to this client.")}
                </Text>
              </VStack>
            </HStack>

            <Button
              height={38}
              style={{ borderRadius: 999, paddingHorizontal: 14 }}
              textStyle={{ fontSize: 13 }}
              left={
                <Icon
                  name="add-circle-outline"
                  size={18}
                  color={theme.colors.background}
                />
              }
              onPress={() => setChooseWorkoutOpen(true)}
            >
              {t("clients.assign", "Assign")}
            </Button>
          </HStack>

          {q.workoutCards.length === 0 ? (
            <Card bordered background="surface2" style={styles.emptyCard}>
              <Text style={{ color: theme.colors.textMuted, textAlign: "center" }}>
                {t("clients.workouts.none", "No workouts in this range.")}
              </Text>
            </Card>
          ) : (
            <VStack style={{ gap: 12 }}>
              {q.workoutCards.map((w) => (
                <Card key={w.row.id} bordered background="surface2" style={styles.assignmentCard}>
                  <VStack style={{ gap: 12 }}>
                    <HStack align="center" justify="space-between">
                      <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                        <Text weight="bold" numberOfLines={2} style={{ fontSize: 16 }}>
                          {w.title}
                        </Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={2}>
                          {t("clients.assign.scheduledFor", "Scheduled for")}: {w.row.scheduledfor}
                          {" • "}
                          {t("clients.assign.source", "Source")}: {w.row.source ?? "—"}
                        </Text>
                      </VStack>

                      <Chip
                        label={w.isManual ? t("clients.manual", "Manual") : t("clients.program", "Program")}
                        isActive
                        activeBackgroundColor={hexToRgba(theme.colors.textMuted, 0.12)}
                        activeBorderColor={hexToRgba(theme.colors.textMuted, 0.18)}
                        activeLabelColor={theme.colors.textMuted}
                      />
                    </HStack>

                    <HStack gap={10}>
                      <Button
                        variant="secondary"
                        height={40}
                        fullWidth
                        style={{ flex: 1 }}
                        disabled={!w.isManual}
                        onPress={() => {
                          setManageMode("workout");
                          setManageAssignmentId(w.row.id);
                          setManageTitle(w.title);
                          setManageDateYmd(w.row.scheduledfor);
                          setManageOpen(true);
                        }}
                      >
                        {t("common.edit", "Edit")}
                      </Button>

                      <Button
                        variant="ghost"
                        height={40}
                        fullWidth
                        style={{ flex: 1 }}
                        textStyle={{ color: theme.colors.danger }}
                        onPress={() =>
                          alert.confirm({
                            title: t("clients.unassignConfirm", "Remove assignment?"),
                            message: t("common.areYouSure", "Are you sure?"),
                            confirmText: t("common.remove", "Remove"),
                            cancelText: t("common.cancel", "Cancel"),
                            destructive: true,
                            onConfirm: async () => {
                              await unassignWorkoutFromClient({ assignmentId: w.row.id });
                              appToast.success(t("clients.unassigned", "Removed"));
                              await q.refetch();
                            },
                          })
                        }
                      >
                        {t("common.remove", "Remove")}
                      </Button>
                    </HStack>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </VStack>

      <ChooseProgramTemplateSheet
        visible={chooseProgramOpen}
        onClose={() => setChooseProgramOpen(false)}
        onSelectProgramTemplate={(id, title) => {
          setProgramToAssign({ id, title });
          setChooseProgramOpen(false);
          setShowDatePicker("program");
        }}
      />

      <ChooseWorkoutTemplateSheet
        visible={chooseWorkoutOpen}
        onClose={() => setChooseWorkoutOpen(false)}
        onSelectWorkoutTemplate={(id, title) => {
          setWorkoutToAssign({ id, title });
          setChooseWorkoutOpen(false);
          setShowDatePicker("workout");
        }}
      />

      <Modal visible={showDatePicker != null} transparent animationType="fade">
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setShowDatePicker(null)}
        />
        <View style={[styles.pickerWrap, { padding: theme.spacing.lg }]}>
          <Card
            padded
            style={{ borderRadius: 18, backgroundColor: theme.colors.surface2 }}
          >
            <VStack style={{ gap: 12 }}>
              <Text weight="bold" style={{ fontSize: 16, textAlign: "center" }}>
                {showDatePicker === "program"
                  ? t("clients.assign.startDate", "Start date")
                  : t("clients.assign.scheduledFor", "Scheduled for")}
              </Text>
              <DateTimePicker
                value={showDatePicker === "program" ? startDate : scheduledDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(e: any, date) => {
                  const mode = showDatePicker;

                  // Android shows a native dialog; once the user picks a date we auto-assign.
                  if (Platform.OS !== "ios") {
                    if (e?.type === "dismissed") {
                      setShowDatePicker(null);
                      return;
                    }
                    if (!date) return;
                    if (mode === "program") setStartDate(date);
                    else if (mode === "workout") setScheduledDate(date);
                    setShowDatePicker(null);
                    if (mode === "program") void assignProgram(toYmd(date));
                    else if (mode === "workout") void assignWorkout(toYmd(date));
                    return;
                  }

                  // iOS inline spinner: update state, user confirms with Assign button.
                  if (!date) return;
                  if (mode === "program") setStartDate(date);
                  else if (mode === "workout") setScheduledDate(date);
                }}
              />
              <HStack gap={10}>
                <Button
                  variant="secondary"
                  fullWidth
                  style={{ flex: 1 }}
                  onPress={() => setShowDatePicker(null)}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                {Platform.OS === "ios" ? (
                  <Button
                    fullWidth
                    style={{ flex: 1 }}
                    onPress={() => {
                      const mode = showDatePicker;
                      setShowDatePicker(null);
                      if (mode === "program") void assignProgram();
                      else void assignWorkout();
                    }}
                    isLoading={saving}
                    disabled={saving}
                  >
                    {t("clients.assign.assign", "Assign")}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="secondary"
                    style={{ flex: 1 }}
                    disabled
                  >
                    {t("clients.assign.pickDate", "Pick a date")}
                  </Button>
                )}
              </HStack>
            </VStack>
          </Card>
        </View>
      </Modal>

      <ProgramAssignmentDuplicateModal
        visible={dupOpen}
        dateLabel={dupDateLabel}
        mode={dupMode as any}
        loading={saving}
        onCancel={() => {
          setDupOpen(false);
          setDupExisting(null);
        }}
        onReactivate={
          dupMode === "archived"
            ? async () => {
                if (!dupExisting?.id) return;
                setSaving(true);
                try {
                  await reactivateClientProgramAssignment({
                    assignmentId: dupExisting.id,
                  });
                  appToast.success(
                    t("clients.assign.duplicate.reactivated", "Reactivated"),
                  );
                  try {
                    await generateProgramWorkoutAssignments({
                      programAssignmentId: dupExisting.id,
                      replaceExisting: true,
                    });
                  } catch {
                    appToast.warn(
                      t(
                        "clients.assign.scheduleGenerationFailed",
                        "Assigned, but schedule generation failed",
                      ),
                    );
                  }
                  setDupOpen(false);
                  setDupExisting(null);
                  await q.refetch();
                } catch (e: unknown) {
                  appToast.error(e instanceof Error ? e.message : "Failed");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
        onReset={async () => {
          if (!dupExisting?.id) return;
          setSaving(true);
          try {
            await resetClientProgramAssignmentProgress({
              assignmentId: dupExisting.id,
            });
            appToast.success(
              t("clients.assign.duplicate.resetDone", "Progress reset"),
            );
            try {
              await generateProgramWorkoutAssignments({
                programAssignmentId: dupExisting.id,
                replaceExisting: true,
              });
            } catch {
              appToast.warn(
                t(
                  "clients.assign.scheduleGenerationFailed",
                  "Assigned, but schedule generation failed",
                ),
              );
            }
            setDupOpen(false);
            setDupExisting(null);
            await q.refetch();
          } catch (e: unknown) {
            appToast.error(e instanceof Error ? e.message : "Failed");
          } finally {
            setSaving(false);
          }
        }}
        onResetAndReactivate={
          dupMode === "archived"
            ? async () => {
                if (!dupExisting?.id) return;
                setSaving(true);
                try {
                  await resetClientProgramAssignmentProgress({
                    assignmentId: dupExisting.id,
                  });
                  await reactivateClientProgramAssignment({
                    assignmentId: dupExisting.id,
                  });
                  appToast.success(
                    t(
                      "clients.assign.duplicate.resetReactivated",
                      "Reset & reactivated",
                    ),
                  );
                  try {
                    await generateProgramWorkoutAssignments({
                      programAssignmentId: dupExisting.id,
                      replaceExisting: true,
                    });
                  } catch {
                    appToast.warn(
                      t(
                        "clients.assign.scheduleGenerationFailed",
                        "Assigned, but schedule generation failed",
                      ),
                    );
                  }
                  setDupOpen(false);
                  setDupExisting(null);
                  await q.refetch();
                } catch (e: unknown) {
                  appToast.error(e instanceof Error ? e.message : "Failed");
                } finally {
                  setSaving(false);
                }
              }
            : undefined
        }
      />

      <ManageAssignmentSheet
        visible={manageOpen}
        onClose={() => setManageOpen(false)}
        mode={manageMode}
        title={manageTitle}
        assignmentId={manageAssignmentId}
        currentDateYmd={manageDateYmd}
        showUnassign={false}
        onUpdateDate={async (ymd) => {
          if (manageMode === "program") {
            await updateProgramAssignmentStartDate({
              assignmentId: manageAssignmentId,
              startDate: ymd,
            });
            try {
              await generateProgramWorkoutAssignments({
                programAssignmentId: manageAssignmentId,
                replaceExisting: true,
              });
            } catch {
              appToast.warn(
                t(
                  "clients.assign.scheduleGenerationFailed",
                  "Assigned, but schedule generation failed",
                ),
              );
            }
          } else {
            await updateWorkoutAssignmentDate({
              assignmentId: manageAssignmentId,
              scheduledFor: ymd,
            });
          }
          setManageDateYmd(ymd);
          await q.refetch();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pickerWrap: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  emptyCard: {
    borderRadius: 18,
  },
  assignmentCard: {
    borderRadius: 18,
  },
});
