import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import type { SetTypeRow } from "@/features/library/types/setTypes";
import type { ExerciseSet, SeriesExercise } from "../types";
import { getSetTypeIconName } from "../utils/setTypeIcons";
import { SetTypePickerSheet } from "./SetTypePickerSheet";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

import { Button, HStack, Icon, Text, useAppAlert, useTheme } from "@/shared/ui";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

type Props = {
  visible: boolean;
  exercise: SeriesExercise | null;
  setTypes: SetTypeRow[];
  onClose: () => void;
  onChange: (updated: SeriesExercise) => void;
};

export function SetsEditorSheet({
  visible,
  exercise,
  setTypes,
  onClose,
  onChange,
}: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();

  const [local, setLocal] = useState<SeriesExercise | null>(exercise);
  const [isSetTypeSheetOpen, setIsSetTypeSheetOpen] = useState(false);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  React.useEffect(() => {
    setLocal(exercise);
    setShowNotes(Boolean(exercise?.notes?.trim()));
  }, [exercise]);

  const setTypeMap = useMemo(() => {
    const m = new Map<string, SetTypeRow>();
    for (const st of setTypes) m.set(st.id, st);
    return m;
  }, [setTypes]);

  if (!local) return null;

  function commit(next: SeriesExercise) {
    setLocal(next);
    onChange(next);
  }

  function updateTempo(key: keyof SeriesExercise["tempo"], value: string) {
    if (!local) return;
    commit({
      ...local,
      tempo: {
        ...local.tempo,
        [key]: value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 3),
      },
    });
  }

  function addSet() {
    if (!local) return;
    const next: ExerciseSet = {
      id: cryptoRandomId(),
      reps: "10",
      restSec: "60",
      setTypeId: null,
    };
    commit({ ...local, sets: [...local.sets, next] });
  }

  function removeSet(id: string) {
    if (!local) return;
    commit({ ...local, sets: local.sets.filter((x) => x.id !== id) });
  }

  function updateSet(id: string, patch: Partial<ExerciseSet>) {
    if (!local) return;
    commit({
      ...local,
      sets: local.sets.map((s) =>
        s.id === id ? { ...s, ...patch, id: s.id } : s
      ),
    });
  }

  function openTempoInfo() {
    alert.show({
      title: t("builder.setsEditor.tempoInfo.title"),
      message: t("builder.setsEditor.tempoInfo.body"),
      buttons: [{ text: t("common.gotIt", "Got it"), variant: "primary" }],
    });
  }

  const activeSet = activeSetId
    ? local.sets.find((s) => s.id === activeSetId) ?? null
    : null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleWrap}>
            <View
              style={[styles.handle, { backgroundColor: theme.colors.textMuted }]}
            />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerTextWrap}>
              <Text weight="bold" style={[styles.headerTitle, { color: theme.colors.text }]}>
                {local.title}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                {t("builder.setsEditor.subtitle")}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: hexToRgba(theme.colors.surface3, 1),
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Icon name="close" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tempo – card block */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface3,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text
                  weight="bold"
                  style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
                >
                  {t("builder.setsEditor.tempoTitle")}
                </Text>
                <Pressable
                  onPress={openTempoInfo}
                  style={({ pressed }) => [
                    styles.infoBtn,
                    {
                      backgroundColor: hexToRgba(theme.colors.accent2, 0.2),
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Icon name="information-circle" size={18} color={theme.colors.accent2} />
                </Pressable>
              </View>
              <View style={styles.tempoRow}>
                <TempoCell
                  label="E"
                  value={local.tempo.eccentric}
                  onChange={(v) => updateTempo("eccentric", v)}
                  theme={theme}
                />
                <Text style={[styles.slash, { color: theme.colors.textMuted }]}>/</Text>
                <TempoCell
                  label={t("builder.setsEditor.tempoLengthened", "Len")}
                  value={local.tempo.bottom}
                  onChange={(v) => updateTempo("bottom", v)}
                  theme={theme}
                />
                <Text style={[styles.slash, { color: theme.colors.textMuted }]}>/</Text>
                <TempoCell
                  label="C"
                  value={local.tempo.concentric}
                  onChange={(v) => updateTempo("concentric", v)}
                  theme={theme}
                />
                <Text style={[styles.slash, { color: theme.colors.textMuted }]}>/</Text>
                <TempoCell
                  label={t("builder.setsEditor.tempoShortened", "Short")}
                  value={local.tempo.top}
                  onChange={(v) => updateTempo("top", v)}
                  theme={theme}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              {!showNotes ? (
                <Button
                  variant="secondary"
                  fullWidth
                  onPress={() => setShowNotes(true)}
                  style={[
                    styles.addNotesBtn,
                    {
                      backgroundColor: hexToRgba(theme.colors.accent, 0.1),
                      borderColor: hexToRgba(theme.colors.accent, 0.25),
                    },
                  ]}
                >
                  {t("builder.workoutBuilder.addTrainerNotes")}
                </Button>
              ) : (
                <View
                  style={[
                    styles.notesCard,
                    {
                      backgroundColor: theme.colors.surface3,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    weight="bold"
                    style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
                  >
                    {t("builder.workoutBuilder.trainerNotes")}
                  </Text>
                  <TextInput
                    value={local.notes ?? ""}
                    onChangeText={(v) => {
                      if (!local) return;
                      commit({ ...local, notes: v });
                    }}
                    placeholder={t("builder.setsEditor.notesPlaceholder")}
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    style={[
                      styles.notesInput,
                      {
                        color: theme.colors.text,
                        backgroundColor: theme.colors.surface2,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* Sets */}
            <View style={styles.section}>
              <View style={styles.setsHeader}>
                <Text
                  weight="bold"
                  style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
                >
                  {t("builder.setsEditor.setsTitle")}
                </Text>
                <Pressable
                  onPress={addSet}
                  style={({ pressed }) => [
                    styles.addSetBtn,
                    {
                      backgroundColor: hexToRgba(theme.colors.accent, 0.2),
                      borderColor: hexToRgba(theme.colors.accent, 0.4),
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Icon name="add" size={18} color={theme.colors.accent} />
                  <Text weight="bold" style={{ color: theme.colors.accent, fontSize: 14 }}>
                    {t("builder.workoutBuilder.addSet")}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.setsList}>
                {local.sets.map((s) => {
                  const st = s.setTypeId ? setTypeMap.get(s.setTypeId) : null;
                  const icon = getSetTypeIconName(st?.key);

                  return (
                    <View
                      key={s.id}
                      style={[
                        styles.setCard,
                        {
                          backgroundColor: theme.colors.surface3,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => {
                          setActiveSetId(s.id);
                          setIsSetTypeSheetOpen(true);
                        }}
                        style={({ pressed }) => [
                          styles.typeChip,
                          {
                            backgroundColor: hexToRgba(theme.colors.accent2, 0.15),
                            borderColor: hexToRgba(theme.colors.accent2, 0.3),
                            opacity: pressed ? 0.9 : 1,
                          },
                        ]}
                      >
                        <Icon name={icon} size={16} color={theme.colors.accent2} />
                        <Text
                          weight="bold"
                          style={[styles.typeChipText, { color: theme.colors.text }]}
                          numberOfLines={1}
                        >
                          {st?.title ?? t("builder.setsEditor.setTypeFallback")}
                        </Text>
                        <Icon name="chevron-down" size={14} color={theme.colors.textMuted} />
                      </Pressable>

                      <HStack style={styles.setRow}>
                        <IconInput
                          icon="fitness"
                          value={String(s.reps)}
                          onChange={(v) => {
                            const n = parseInt(v || "0", 10);
                            updateSet(s.id, {
                              reps: Number.isFinite(n) ? n.toString() : "0",
                            });
                          }}
                          suffix={t("builder.setsEditor.repsSuffix", "reps")}
                          theme={theme}
                        />
                        <IconInput
                          icon="timer"
                          value={String(s.restSec)}
                          onChange={(v) => {
                            const n = parseInt(v || "0", 10);
                            updateSet(s.id, {
                              restSec: Number.isFinite(n) ? n.toString() : "0",
                            });
                          }}
                          suffix={t("builder.setsEditor.restSuffix", "s")}
                          theme={theme}
                        />
                        <Pressable
                          onPress={() => removeSet(s.id)}
                          style={({ pressed }) => [
                            styles.deleteBtn,
                            {
                              backgroundColor: hexToRgba(theme.colors.danger, 0.15),
                              borderColor: hexToRgba(theme.colors.danger, 0.3),
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}
                        >
                          <Icon name="trash" size={18} color={theme.colors.danger} />
                        </Pressable>
                      </HStack>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>

        <SetTypePickerSheet
          visible={isSetTypeSheetOpen}
          setTypes={setTypes}
          selectedId={activeSet?.setTypeId ?? null}
          onClose={() => {
            setIsSetTypeSheetOpen(false);
            setActiveSetId(null);
          }}
          onPick={(id) => {
            if (!activeSetId) return;
            updateSet(activeSetId, { setTypeId: id });
          }}
        />
      </View>
    </Modal>
  );
}

function TempoCell({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.tempoCellWrap}>
      <Text style={[styles.tempoCellLabel, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="-"
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="number-pad"
        style={[
          styles.tempoInput,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
      />
    </View>
  );
}

function IconInput({
  icon,
  value,
  onChange,
  suffix,
  theme,
}: {
  icon: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        styles.iconInputWrap,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Icon name={icon} size={16} color={theme.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^\d]/g, ""))}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.iconInput, { color: theme.colors.text }]}
      />
      <Text style={[styles.iconInputSuffix, { color: theme.colors.textMuted }]}>
        {suffix}
      </Text>
    </View>
  );
}

function cryptoRandomId() {
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    height: "90%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tempoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  tempoCellWrap: {
    flex: 1,
    alignItems: "center",
  },
  tempoCellLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  tempoInput: {
    width: "100%",
    maxWidth: 56,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  slash: {
    fontSize: 16,
    fontWeight: "700",
    paddingBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  addNotesBtn: {
    borderWidth: 1,
    borderRadius: 14,
  },
  notesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  notesInput: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    textAlignVertical: "top",
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  setsList: {
    gap: 12,
  },
  setCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    flex: 1,
    fontSize: 14,
  },
  setRow: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  iconInputWrap: {
    flex: 1,
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconInput: {
    flex: 1,
    minWidth: 40,
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 0,
    textAlign: "center",
  },
  iconInputSuffix: {
    fontSize: 13,
    fontWeight: "600",
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
