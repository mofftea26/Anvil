import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  assignWorkoutTemplateToClients,
  checkWorkoutExists,
  fetchClientProgramAssignmentByUniqueKey,
  generateProgramWorkoutAssignments,
  insertClientProgramAssignment,
  listActiveProgramAssignmentsByClientIds,
  reactivateClientProgramAssignment,
  resetClientProgramAssignmentProgress,
} from "@/features/clients/api/assignments.api";
import { useTrainerClientsOptions } from "@/features/clients/hooks/assignments/useTrainerClientsOptions";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  BottomSheetPicker,
  Button,
  Card,
  Divider,
  Icon,
  HStack,
  Input,
  Text,
  useAppAlert,
  useTheme,
  VStack,
} from "@/shared/ui";

import { ProgramAssignmentDuplicateModal } from "./ProgramAssignmentDuplicateModal";

function toYmd(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type AssignItemMode = "workout" | "program";

export function AssignToClientsSheet(props: {
  visible: boolean;
  onClose: () => void;
  mode: AssignItemMode;
  item: { id: string; title: string };
  initialClientIds?: string[];
  onAssigned?: () => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const insets = useSafeAreaInsets();
  const alert = useAppAlert();

  const { trainerId, options, isLoading, refetch } = useTrainerClientsOptions();

  const [clientIds, setClientIds] = useState<string[]>(props.initialClientIds ?? []);
  const [saving, setSaving] = useState(false);

  const [scheduledDate, setScheduledDate] = useState<Date>(() => new Date());
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");

  const [dupOpen, setDupOpen] = useState(false);
  const [dupLoading, setDupLoading] = useState(false);
  const [dupExisting, setDupExisting] = useState<any | null>(null);

  useEffect(() => {
    if (!props.visible) return;
    setClientIds(props.initialClientIds ?? []);
    setScheduledDate(new Date());
    setStartDate(new Date());
    setShowDatePicker(false);
    setNotes("");
    setDupOpen(false);
    setDupLoading(false);
    setDupExisting(null);
  }, [props.initialClientIds, props.visible]);

  const title = props.mode === "workout" ? t("clients.assign.workout", "Assign workout") : t("clients.assign.program", "Assign program");

  const canSubmit = useMemo(() => {
    if (!trainerId) return false;
    if (!props.item.id) return false;
    return clientIds.length > 0;
  }, [clientIds.length, props.item.id, trainerId]);

  const scheduledLabel = useMemo(() => {
    return scheduledDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }, [scheduledDate]);

  const startDateLabel = useMemo(() => {
    return startDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }, [startDate]);

  const dupDateLabel = useMemo(() => {
    return startDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [startDate]);

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const locked = await listActiveProgramAssignmentsByClientIds({
        trainerId,
        clientIds,
      }).catch(() => []);
      const lockedSet = new Set(locked.map((x) => x.clientid));
      const allowedClientIds = clientIds.filter((id) => !lockedSet.has(id));

      if (allowedClientIds.length !== clientIds.length) {
        const skipped = clientIds.length - allowedClientIds.length;
        appToast.error(
          t(
            "clients.assign.skippedLocked",
            "{{n}} client(s) have an active program and were skipped.",
            { n: skipped }
          )
        );
      }
      if (allowedClientIds.length === 0) {
        return;
      }

      if (props.mode === "workout") {
        const exists = await checkWorkoutExists(props.item.id).catch(() => false);
        if (!exists) {
          alert.show({
            title: t("clients.assign.workoutNotFoundTitle", "Workout not found"),
            message: t(
              "clients.assign.workoutNotFoundBody",
              "This workout template doesn’t exist anymore. Refresh the list and pick a valid workout."
            ),
            buttons: [
              { text: t("common.ok", "OK"), variant: "primary" },
            ],
          });
          return;
        }
        await assignWorkoutTemplateToClients({
          trainerId,
          clientIds: allowedClientIds,
          workoutTemplateId: props.item.id,
          scheduledFor: toYmd(scheduledDate),
        });
        appToast.success(
          t("clients.assign.assignedWorkout", "Workout assigned")
        );
      } else {
        let assignedCount = 0;
        for (const clientId of allowedClientIds) {
          try {
            const inserted = await insertClientProgramAssignment({
              trainerId,
              clientId,
              programTemplateId: props.item.id,
              startDate: toYmd(startDate),
              notes: notes.trim() ? notes.trim() : null,
            });
            // Generate program workouts so trainer details + client schedule can show them.
            await generateProgramWorkoutAssignments({
              programAssignmentId: inserted.id,
              replaceExisting: false,
            });
            assignedCount += 1;
          } catch (e: any) {
            const httpStatus = Number(e?.status ?? e?.statusCode ?? NaN);
            const pgCode = String(e?.code ?? "");
            const isDup = httpStatus === 409 || pgCode === "23505";
            if (!isDup) throw e;

            const existing = await fetchClientProgramAssignmentByUniqueKey({
              clientId,
              programTemplateId: props.item.id,
              startDate: toYmd(startDate),
            });
            if (!existing) throw e;

            setDupExisting(existing);
            setDupOpen(true);
            return;
          }
        }

        if (assignedCount > 0) {
          appToast.success(
            t("clients.assign.assignedProgram", "Program assigned")
          );
        }
      }
      props.onAssigned?.();
      props.onClose();
    } catch (e: unknown) {
      appToast.error(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal visible={props.visible} transparent animationType="slide">
        <View style={[styles.backdrop, { paddingTop: insets.top }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={props.onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 12) + 14,
              maxHeight: "86%",
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>
              {title}
            </Text>
            <Pressable
              onPress={props.onClose}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Icon name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <VStack style={{ padding: 16, gap: 12 }}>
            <Card
              background="surface2"
              style={{ borderRadius: 16, backgroundColor: theme.colors.surface3 }}
            >
              <HStack align="center" justify="space-between">
                <VStack style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <Text muted style={{ fontSize: 12 }}>
                    {props.mode === "workout" ? t("clients.assign.workoutLabel", "Workout") : t("clients.assign.programLabel", "Program")}
                  </Text>
                  <Text weight="bold" numberOfLines={2} style={{ fontSize: 16 }}>
                    {props.item.title}
                  </Text>
                </VStack>
              </HStack>
            </Card>

            <BottomSheetPicker
              mode="multi"
              label={t("clients.assign.clients", "Clients")}
              title={t("clients.assign.pickClients", "Pick clients")}
              value={clientIds}
              onChange={setClientIds}
              options={options}
              searchable
              loading={isLoading}
              requireConfirm
              confirmLabel={t("common.apply", "Apply")}
              clearLabel={t("common.clear", "Clear")}
            />

            {props.mode === "workout" ? (
              <>
                <Divider opacity={0.5} />
                <Card
                  background="surface2"
                  style={{ borderRadius: 16, backgroundColor: theme.colors.surface3 }}
                >
                  <HStack align="center" justify="space-between">
                    <VStack style={{ gap: 4 }}>
                      <Text muted style={{ fontSize: 12 }}>
                        {t("clients.assign.scheduledFor", "Scheduled for")}
                      </Text>
                      <Text weight="bold" style={{ fontSize: 16 }}>
                        {scheduledLabel}
                      </Text>
                    </VStack>
                    <Button
                      variant="icon"
                      height={40}
                      onPress={() => setShowDatePicker(true)}
                      left={<Icon name="calendar-outline" size={22} color={theme.colors.accent} />}
                    />
                  </HStack>
                </Card>

                {showDatePicker ? (
                  <DateTimePicker
                    value={scheduledDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_event, date) => {
                      if (Platform.OS !== "ios") setShowDatePicker(false);
                      if (date) setScheduledDate(date);
                    }}
                  />
                ) : null}
              </>
            ) : (
              <>
                <Divider opacity={0.5} />
                <Card
                  background="surface2"
                  style={{ borderRadius: 16, backgroundColor: theme.colors.surface3 }}
                >
                  <HStack align="center" justify="space-between">
                    <VStack style={{ gap: 4 }}>
                      <Text muted style={{ fontSize: 12 }}>
                        {t("clients.assign.startDate", "Start date")}
                      </Text>
                      <Text weight="bold" style={{ fontSize: 16 }}>
                        {startDateLabel}
                      </Text>
                    </VStack>
                    <Button
                      variant="icon"
                      height={40}
                      onPress={() => setShowDatePicker(true)}
                      left={<Icon name="calendar-outline" size={22} color={theme.colors.accent} />}
                    />
                  </HStack>
                </Card>

                {showDatePicker ? (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_event, date) => {
                      if (Platform.OS !== "ios") setShowDatePicker(false);
                      if (date) setStartDate(date);
                    }}
                  />
                ) : null}

                <Input
                  label={t("clients.assign.notes", "Notes (optional)")}
                  placeholder={t("clients.assign.notesPlaceholder", "Add a note for the client…")}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  autoGrow
                />
              </>
            )}

            <Button
              onPress={() => void submit()}
              disabled={!canSubmit}
              isLoading={saving}
              style={{ marginTop: 6 }}
            >
              {t("clients.assign.assign", "Assign")}
            </Button>

            <Button
              variant="secondary"
              onPress={() => void refetch()}
              disabled={isLoading}
            >
              {t("common.refresh", "Refresh")}
            </Button>
          </VStack>
        </View>
        </View>
      </Modal>

      <ProgramAssignmentDuplicateModal
        visible={dupOpen}
        dateLabel={dupDateLabel}
        mode={String(dupExisting?.status ?? "") === "archived" ? "archived" : "active"}
        loading={dupLoading}
        onCancel={() => {
          setDupOpen(false);
          setDupExisting(null);
          setSaving(false);
        }}
        onReactivate={
          String(dupExisting?.status ?? "") === "archived"
            ? async () => {
                if (!dupExisting?.id) return;
                setDupLoading(true);
                try {
                  await reactivateClientProgramAssignment({ assignmentId: dupExisting.id });
                  // best-effort: ensure program workouts exist
                  await generateProgramWorkoutAssignments({ programAssignmentId: dupExisting.id, replaceExisting: false });
                  appToast.success(t("clients.assign.duplicate.reactivated", "Reactivated"));
                  setDupOpen(false);
                  setDupExisting(null);
                  props.onAssigned?.();
                  props.onClose();
                } catch (e: unknown) {
                  appToast.error(e instanceof Error ? e.message : "Failed");
                } finally {
                  setDupLoading(false);
                  setSaving(false);
                }
              }
            : undefined
        }
        onReset={async () => {
          if (!dupExisting?.id) return;
          setDupLoading(true);
          try {
            await resetClientProgramAssignmentProgress({ assignmentId: dupExisting.id });
          // best-effort: ensure program workouts exist
          await generateProgramWorkoutAssignments({ programAssignmentId: dupExisting.id, replaceExisting: false });
            appToast.success(t("clients.assign.duplicate.resetDone", "Progress reset"));
            setDupOpen(false);
            setDupExisting(null);
            props.onAssigned?.();
            props.onClose();
          } catch (e: unknown) {
            appToast.error(e instanceof Error ? e.message : "Failed");
          } finally {
            setDupLoading(false);
            setSaving(false);
          }
        }}
        onResetAndReactivate={
          String(dupExisting?.status ?? "") === "archived"
            ? async () => {
                if (!dupExisting?.id) return;
                setDupLoading(true);
                try {
                  await resetClientProgramAssignmentProgress({ assignmentId: dupExisting.id });
                // best-effort: ensure program workouts exist
                await generateProgramWorkoutAssignments({ programAssignmentId: dupExisting.id, replaceExisting: false });
                  appToast.success(t("clients.assign.duplicate.resetReactivated", "Reset & reactivated"));
                  setDupOpen(false);
                  setDupExisting(null);
                  props.onAssigned?.();
                  props.onClose();
                } catch (e: unknown) {
                  appToast.error(e instanceof Error ? e.message : "Failed");
                } finally {
                  setDupLoading(false);
                  setSaving(false);
                }
              }
            : undefined
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1 },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 8 },
});

