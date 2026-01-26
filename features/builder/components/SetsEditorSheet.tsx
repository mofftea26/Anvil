import React, { useMemo, useState } from "react";
import {
    Alert,
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

import { Button, HStack, Icon, Text, useTheme } from "@/shared/ui";
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
    Alert.alert(
      t("builder.setsEditor.tempoInfo.title"),
      t("builder.setsEditor.tempoInfo.body")
    );
  }

  const activeSet = activeSetId
    ? local.sets.find((s) => s.id === activeSetId) ?? null
    : null;



  return (
    <Modal visible={visible} transparent animationType="fade">
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
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{local.title}</Text>
              <Text style={{ opacity: 0.7, marginTop: 2 }}>
                {t("builder.setsEditor.subtitle")}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.colors.surface3 },
              ]}
            >
              <Icon name="close" size={18} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
            {/* Tempo */}
            <View style={[styles.block, { borderColor: theme.colors.border }]}>
              <View style={styles.blockHeader}>
                <Text style={{ fontWeight: "900" }}>
                  {t("builder.setsEditor.tempoTitle")}
                </Text>

                <Pressable onPress={openTempoInfo} style={styles.infoBtn}>
                  <Icon
                    name="information-circle"
                    size={18}
                    color="white"
                  />
                </Pressable>
              </View>

              <View style={styles.tempoRow}>
                <TempoInput
                  value={local.tempo.eccentric}
                  onChangeText={(v) => updateTempo("eccentric", v)}
                />
                <Text style={styles.slash}>/</Text>
                <TempoInput
                  value={local.tempo.bottom}
                  onChangeText={(v) => updateTempo("bottom", v)}
                />
                <Text style={styles.slash}>/</Text>
                <TempoInput
                  value={local.tempo.concentric}
                  onChangeText={(v) => updateTempo("concentric", v)}
                />
                <Text style={styles.slash}>/</Text>
                <TempoInput
                  value={local.tempo.top}
                  onChangeText={(v) => updateTempo("top", v)}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={{ paddingHorizontal: 14, marginTop: 12 }}>
              {!showNotes ? (
                <Button
                  variant="secondary"
                  fullWidth
                  onPress={() => setShowNotes(true)}
                >
                  {t("builder.workoutBuilder.addTrainerNotes")}
                </Button>
              ) : (
                <View
                  style={[
                    styles.notesBox,
                    {
                      backgroundColor: theme.colors.surface3,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontWeight: "900", marginBottom: 8 }}>
                    {t("builder.workoutBuilder.trainerNotes")}
                  </Text>
                  <TextInput
                    value={local.notes ?? ""}
                    onChangeText={(v) => {
                      if (!local) return;
                      commit({ ...local, notes: v });
                    }}
                    placeholder={t("builder.setsEditor.notesPlaceholder")}
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    multiline
                    style={[
                      styles.notesInput,
                      { color: theme.colors.text },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* Sets */}
            <View style={styles.setsHeader}>
              <Text style={{ fontWeight: "900", fontSize: 16 }}>
                {t("builder.setsEditor.setsTitle")}
              </Text>
              <Button variant="ghost" onPress={addSet}>
                {t("builder.workoutBuilder.addSet")}
              </Button>
            </View>

            <View style={{ gap: 10 }}>
              {local.sets.map((s) => {
                const st = s.setTypeId ? setTypeMap.get(s.setTypeId) : null;
                const icon = getSetTypeIconName(st?.key);

                return (
                  <View
                    key={s.id}
                    style={[
                      styles.setRow,
                      {
                        backgroundColor: theme.colors.surface3,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    {/* Set type picker */}
                    <Pressable
                      onPress={() => {
                        setActiveSetId(s.id);
                        setIsSetTypeSheetOpen(true);
                      }}
                      style={styles.typeChip}
                    >
                      <Icon name={icon} size={14} color="white" />
                      <Text
                        style={{ color: "white", fontWeight: "900" }}
                        numberOfLines={1}
                      >
                        {st?.title ?? t("builder.setsEditor.setTypeFallback")}
                      </Text>
                      <Icon
                        name="chevron-down"
                        size={14}
                        color="rgba(255,255,255,0.7)"
                      />
                    </Pressable>

                    {/* Reps input */}
                    <HStack style={{ flex: 1, justifyContent: "space-between",alignItems: "center",gap: 10 }}>
                    <IconInput
                      icon="fitness"
                      value={String(s.reps)}
                      onChange={(v) => {
                        const n = parseInt(v || "0", 10);
                        updateSet(s.id, { reps: Number.isFinite(n) ? n.toString() : "0" });
                      }}
                      suffix="reps"
                    />

                    {/* Rest input */}
                    <IconInput
                      icon="hourglass-outline"
                      value={String(s.restSec)}
                      onChange={(v) => {
                        const n = parseInt(v || "0", 10);
                        updateSet(s.id, {
                          restSec: Number.isFinite(n) ? n.toString() : "0",
                        });
                      }}
                      suffix="s"
                    />

                    {/* Remove */}
                    <Pressable
                      onPress={() => removeSet(s.id)}
                      style={styles.trash}
                    >
                      <Icon
                        name="trash"
                        size={16}
                        color="rgba(255,255,255,0.9)"
                      />
                    </Pressable>
                    </HStack>
                  </View>
                );
              })}
            </View>

            <View style={{ height: 18 }} />
          </ScrollView>
        </View>

        {/* Set type picker sheet */}
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

function TempoInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  const theme = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="-"
      placeholderTextColor="rgba(255,255,255,0.35)"
      keyboardType="default"
      style={[
        styles.tempoInput,
        {
          backgroundColor: theme.colors.surface3,
          borderColor: theme.colors.border,
          color: theme.colors.text,
        },
      ]}
    />
  );
}

function IconInput({
  icon,
  value,
  onChange,
  suffix,
}: {
  icon: any;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
}) {
  return (
    <View style={styles.iconInputWrap}>
      <Icon name={icon} size={14} color="white" />
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^\d]/g, ""))}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={styles.iconInput}
      />
      <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
        {suffix}
      </Text>
    </View>
  );
}

// local id generator
function cryptoRandomId() {
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    maxHeight: "88%",
    overflow: "hidden",
  },
  header: {
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  block: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 10,
  },
  infoBtn: {
    padding: 6,
  },
  tempoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tempoInput: {
    width: 50,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 14,
  },
  slash: {
    width: 14,
    textAlign: "center",
    opacity: 0.6,
    fontWeight: "900",
  },
  notesBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  notesInput: {
    minHeight: 70,
    fontSize: 14,
    fontWeight: "600",
  },
  setsHeader: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  setRow: {
    marginHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  typeChip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    width: "100%",
  },
  iconInputWrap: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  iconInput: {
    width: 44,
    color: "white",
    fontWeight: "900",
    paddingVertical: 0,
    paddingHorizontal: 6,
    textAlign: "center",
  },
  trash: {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
