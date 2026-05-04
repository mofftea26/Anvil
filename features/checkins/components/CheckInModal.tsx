import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrainerClientsOptions } from "@/features/clients/hooks/assignments/useTrainerClientsOptions";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  BottomSheetPicker,
  Button,
  Card,
  Divider,
  HStack,
  Icon,
  Input,
  Text,
  useAppAlert,
  useTheme,
  VStack,
} from "@/shared/ui";
import { DEFAULT_SCHEDULE_TIME, normalizeScheduleTime } from "@/shared/utils/scheduleTime";

import type { CheckInStatus, TrainerCheckIn } from "../types";

function timeStringToDate(t: string | null): Date {
  const n = normalizeScheduleTime(t ?? DEFAULT_SCHEDULE_TIME);
  const [hh, mm] = n.split(":").map((x) => Number(x));
  const d = new Date();
  d.setHours(hh ?? 8, mm ?? 0, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  const hh = d.getHours();
  const mm = d.getMinutes();
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

export function CheckInModal(props: {
  visible: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial: TrainerCheckIn | null;
  defaultDateYmd: string;
  onSave: (input: {
    id: string | null;
    clientId: string;
    scheduledFor: string;
    scheduledTime: string | null;
    status: CheckInStatus;
    notes: string | null;
    metricSummary: string | null;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const insets = useSafeAreaInsets();
  const alert = useAppAlert();
  const { options, isLoading: clientsLoading } = useTrainerClientsOptions();

  const [clientId, setClientId] = useState<string | null>(null);
  const [timeValue, setTimeValue] = useState(() => timeStringToDate(null));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [status, setStatus] = useState<CheckInStatus>("scheduled");
  const [notes, setNotes] = useState("");
  const [metricSummary, setMetricSummary] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!props.visible) return;
    if (props.mode === "edit" && props.initial) {
      const row = props.initial;
      setClientId(row.clientId);
      setTimeValue(timeStringToDate(row.scheduledTime));
      setStatus(row.status);
      setNotes(row.notes ?? "");
      setMetricSummary(row.metricSummary ?? "");
    } else {
      setClientId(null);
      setTimeValue(timeStringToDate(null));
      setStatus("scheduled");
      setNotes("");
      setMetricSummary("");
    }
    setShowTimePicker(false);
  }, [props.visible, props.mode, props.initial, props.defaultDateYmd]);

  const statusOptions = useMemo(
    () =>
      (["scheduled", "completed", "missed", "cancelled"] as const).map((s) => ({
        value: s,
        label: t(`trainer.checkIns.status.${s}`, s),
      })),
    [t]
  );

  const clientName =
    props.mode === "edit" && props.initial
      ? [props.initial.clientFirstName, props.initial.clientLastName].filter(Boolean).join(" ").trim() ||
        t("trainer.checkIns.unnamedClient", "Client")
      : "";

  const canSave =
    props.mode === "create"
      ? Boolean(clientId)
      : Boolean(props.initial?.id);

  const scheduledForYmd =
    props.mode === "edit" && props.initial
      ? props.initial.scheduledFor
      : props.defaultDateYmd;

  const onSavePress = async () => {
    if (!canSave || saving) return;
    const cid = props.mode === "edit" ? props.initial?.clientId : clientId;
    if (!cid) {
      appToast.error(t("trainer.checkIns.pickClient", "Choose a client"));
      return;
    }
    setSaving(true);
    try {
      await props.onSave({
        id: props.mode === "edit" ? props.initial?.id ?? null : null,
        clientId: cid,
        scheduledFor: scheduledForYmd,
        scheduledTime: dateToTimeString(timeValue),
        status,
        notes: notes.trim() ? notes.trim() : null,
        metricSummary: metricSummary.trim() ? metricSummary.trim() : null,
      });
      appToast.success(t("trainer.checkIns.saved", "Check-in saved"));
      props.onClose();
    } catch (e: unknown) {
      appToast.error(e instanceof Error ? e.message : t("common.tryAgain", "Try again"));
    } finally {
      setSaving(false);
    }
  };

  const onDeletePress = () => {
    if (!props.initial?.id || !props.onDelete) return;
    const id = props.initial.id;
    alert.confirm({
      title: t("trainer.checkIns.deleteTitle", "Delete check-in?"),
      message: t("trainer.checkIns.deleteBody", "This removes the scheduled slot."),
      confirmText: t("common.delete", "Delete"),
      cancelText: t("common.cancel", "Cancel"),
      destructive: true,
      onConfirm: async () => {
        try {
          await props.onDelete?.(id);
          appToast.success(t("trainer.checkIns.deleted", "Check-in deleted"));
          props.onClose();
        } catch (e: unknown) {
          appToast.error(e instanceof Error ? e.message : t("common.tryAgain", "Try again"));
        }
      },
    });
  };

  return (
    <Modal visible={props.visible} transparent animationType="slide">
      <View style={[styles.backdrop, { paddingTop: insets.top }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={props.onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 12) + 12,
              maxHeight: "88%",
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
          </View>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text weight="bold" style={{ fontSize: 18 }}>
              {props.mode === "create"
                ? t("trainer.checkIns.newTitle", "New check-in")
                : t("trainer.checkIns.editTitle", "Edit check-in")}
            </Text>
            <Pressable onPress={props.onClose} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          >
            {props.mode === "create" ? (
              <BottomSheetPicker
                label={t("trainer.checkIns.client", "Client")}
                title={t("trainer.checkIns.pickClientSheet", "Choose a client")}
                placeholder={t("trainer.checkIns.pickClient", "Choose a client")}
                value={clientId}
                onChange={setClientId}
                options={options}
                searchable
                loading={clientsLoading}
              />
            ) : (
              <Card background="surface2" style={{ borderRadius: 16, backgroundColor: theme.colors.surface3 }}>
                <Text muted style={{ fontSize: 12 }}>
                  {t("trainer.checkIns.client", "Client")}
                </Text>
                <Text weight="bold" style={{ fontSize: 16, marginTop: 4 }}>
                  {clientName}
                </Text>
              </Card>
            )}

            <Card background="surface2" style={{ borderRadius: 16, backgroundColor: theme.colors.surface3 }}>
              <HStack align="center" justify="space-between">
                <VStack style={{ gap: 4 }}>
                  <Text muted style={{ fontSize: 12 }}>
                    {t("trainer.checkIns.time", "Time")}
                  </Text>
                  <Text weight="bold" style={{ fontSize: 16 }}>
                    {timeValue.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </VStack>
                <Button
                  variant="icon"
                  height={40}
                  onPress={() => setShowTimePicker((x) => !x)}
                  left={<Icon name="timer-outline" size={22} color={theme.colors.accent} />}
                />
              </HStack>
            </Card>

            {showTimePicker ? (
              <DateTimePicker
                value={timeValue}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_e, date) => {
                  if (Platform.OS !== "ios") setShowTimePicker(false);
                  if (date) setTimeValue(date);
                }}
              />
            ) : null}

            <BottomSheetPicker
              label={t("trainer.checkIns.statusField", "Status")}
              title={t("trainer.checkIns.statusField", "Status")}
              value={status}
              onChange={(v) => setStatus((v as CheckInStatus) ?? "scheduled")}
              options={statusOptions}
            />

            <VStack style={{ gap: 6 }}>
              <Text muted style={{ fontSize: 12 }}>
                {t("trainer.checkIns.notes", "Notes")}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t("trainer.checkIns.notesPlaceholder", "Session notes…")}
                placeholderTextColor={theme.colors.textMuted}
                multiline
                style={{
                  minHeight: 72,
                  borderRadius: theme.radii.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: 12,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface3,
                  textAlignVertical: "top",
                }}
              />
            </VStack>

            <Input
              label={t("trainer.checkIns.metrics", "Metrics summary")}
              value={metricSummary}
              onChangeText={setMetricSummary}
            />

            <Divider opacity={0.5} />

            <HStack gap={10} style={{ flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                fullWidth
                style={{ flex: 1 }}
                onPress={props.onClose}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button fullWidth style={{ flex: 1 }} disabled={!canSave} isLoading={saving} onPress={() => void onSavePress()}>
                {t("common.save", "Save")}
              </Button>
            </HStack>

            {props.mode === "edit" && props.onDelete ? (
              <Button variant="secondary" onPress={onDeletePress} fullWidth>
                {t("common.delete", "Delete")}
              </Button>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  handle: { width: 42, height: 4, borderRadius: 999 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
