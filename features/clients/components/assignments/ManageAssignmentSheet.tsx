import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useAppAlert, appToast, Button, Card, Divider, Icon, Text, useTheme, VStack, HStack } from "@/shared/ui";

function toYmd(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type ManageAssignmentMode = "workout" | "program";

export function ManageAssignmentSheet(props: {
  visible: boolean;
  onClose: () => void;
  mode: ManageAssignmentMode;
  title: string;
  assignmentId: string;
  currentDateYmd: string;
  onUpdateDate: (ymd: string) => Promise<void>;
  showUnassign?: boolean;
  onUnassign?: () => Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const alert = useAppAlert();
  const insets = useSafeAreaInsets();

  const [date, setDate] = useState(() => new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const label = props.mode === "workout"
    ? t("clients.assign.scheduledFor", "Scheduled for")
    : t("clients.assign.startDate", "Start date");

  const display = useMemo(() => {
    try {
      const ymd = props.currentDateYmd;
      const [y, m, d] = ymd.split("-").map((x) => Number(x));
      const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
      return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    } catch {
      return props.currentDateYmd;
    }
  }, [props.currentDateYmd]);

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
              paddingBottom: Math.max(insets.bottom, 12) + 14,
              maxHeight: "80%",
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text weight="bold" style={{ fontSize: 18, color: theme.colors.text }}>
              {t("clients.manageAssignment", "Manage")}
            </Text>
            <Pressable
              onPress={props.onClose}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Icon name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <VStack style={{ padding: 16, gap: 12 }}>
            <Card background="surface2" style={{ borderRadius: 16, backgroundColor: theme.colors.surface3 }}>
              <VStack style={{ gap: 4 }}>
                <Text muted style={{ fontSize: 12 }}>{t("clients.item", "Item")}</Text>
                <Text weight="bold" numberOfLines={2} style={{ fontSize: 16 }}>{props.title}</Text>
              </VStack>
            </Card>

            <Divider opacity={0.6} />

            <Card background="surface2" style={{ borderRadius: 16, backgroundColor: theme.colors.surface3 }}>
              <HStack align="center" justify="space-between">
                <VStack style={{ gap: 4 }}>
                  <Text muted style={{ fontSize: 12 }}>{label}</Text>
                  <Text weight="bold" style={{ fontSize: 16 }}>{display}</Text>
                </VStack>
                <Button
                  variant="icon"
                  height={40}
                  onPress={() => {
                    setShowPicker(true);
                    // initialize picker date from currentDateYmd
                    const [y, m, d] = props.currentDateYmd.split("-").map((x) => Number(x));
                    if (y && m && d) setDate(new Date(y, m - 1, d));
                  }}
                  left={<Icon name="calendar-outline" size={22} color={theme.colors.accent} />}
                />
              </HStack>
            </Card>

            {showPicker ? (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event, next) => {
                  if (Platform.OS !== "ios") setShowPicker(false);
                  if (next) setDate(next);
                }}
              />
            ) : null}

            <Button
              onPress={() => {
                if (saving) return;
                const ymd = toYmd(date);
                setSaving(true);
                props.onUpdateDate(ymd)
                  .then(() => appToast.success(t("common.saved", "Saved")))
                  .then(() => props.onClose())
                  .catch((e: unknown) => {
                    const msg = e instanceof Error ? e.message : t("common.error", "Something went wrong");
                    appToast.error(msg);
                  })
                  .finally(() => setSaving(false));
              }}
              disabled={saving}
              isLoading={saving}
            >
              {t("common.save", "Save")}
            </Button>

            {props.showUnassign ? (
              <Button
                variant="secondary"
                onPress={() => {
                  if (!props.onUnassign) return;
                  alert.confirm({
                    title: t("clients.unassignConfirm", "Unassign?"),
                    message: t("common.areYouSure", "Are you sure?"),
                    confirmText: t("common.remove", "Remove"),
                    cancelText: t("common.cancel", "Cancel"),
                    destructive: true,
                    onConfirm: async () => {
                      setSaving(true);
                      try {
                        await props.onUnassign?.();
                        appToast.success(t("clients.unassigned", "Removed"));
                        props.onClose();
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : t("common.error", "Something went wrong");
                        appToast.error(msg);
                      } finally {
                        setSaving(false);
                      }
                    },
                  });
                }}
                disabled={saving}
              >
                {t("clients.unassign", "Unassign")}
              </Button>
            ) : null}
          </VStack>
        </View>
      </View>
    </Modal>
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

