import { Button, Card, Text, useTheme } from "@/src/shared/ui";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

const STORAGE_PREFIX = "anvil:workoutDraft:";

type Draft = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  blocks: DraftBlock[];
};

type DraftBlock = {
  id: string;
  label: string; // A, B, C...
  orderIndex: number;
  exercises: DraftExercise[];
};

type DraftExercise = {
  id: string;
  code: string; // A1, A2...
  title: string;
  trainerNote: string;
  sets: DraftSet[];
};

type DraftSet = {
  id: string;
  setTypeId: string | null;
  repsTarget: number | null;
  tempo: string | null;
  restSeconds: number | null;
  orderIndex: number;
};

function createLocalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const MOCK_EXERCISES = [
  "Incline Dumbbell Press",
  "Flat Dumbbell Press",
  "Seated Cable Row",
  "Lat Pulldown (Wide)",
  "Bayesian Curl",
  "Cable Lateral Raise",
];

export default function WorkoutBuilderDraftScreen() {
  const theme = useTheme();
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const { rows: setTypesRows } = useSetTypesDictionary();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // modal selection
  const [exercisePicker, setExercisePicker] = useState<{
    open: boolean;
    blockId: string | null;
  }>({ open: false, blockId: null });

  const [setTypePicker, setSetTypePicker] = useState<{
    open: boolean;
    onPick: ((id: string) => void) | null;
  }>({ open: false, onPick: null });

  const saveTimer = useRef<NodeJS.Timeout | null | number>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);

      const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${draftId}`);
      if (!mounted) return;

      if (!raw) {
        setDraft(null);
        setIsLoading(false);
        return;
      }

      setDraft(JSON.parse(raw));
      setIsLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [draftId]);

  function queueSave(next: Draft) {
    setDraft(next);

    if (saveTimer.current) clearTimeout(saveTimer.current);

    setIsSaving(true);
    saveTimer.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(
          `${STORAGE_PREFIX}${draftId}`,
          JSON.stringify({ ...next, updatedAt: new Date().toISOString() })
        );
      } finally {
        setIsSaving(false);
      }
    }, 350);
  }

  const blocks = draft?.blocks ?? [];

  const setTypes = useMemo(() => {
    return setTypesRows.map((s) => ({
      id: s.id,
      title: s.title,
    }));
  }, [setTypesRows]);

  function addBlock() {
    if (!draft) return;

    const nextLabel = String.fromCharCode(65 + draft.blocks.length); // A,B,C...
    const next: Draft = {
      ...draft,
      blocks: [
        ...draft.blocks,
        {
          id: createLocalId("block"),
          label: nextLabel,
          orderIndex: draft.blocks.length,
          exercises: [],
        },
      ],
    };

    queueSave(next);
  }

  function openExercisePicker(blockId: string) {
    setExercisePicker({ open: true, blockId });
  }

  function addExerciseToBlock(blockId: string, title: string) {
    if (!draft) return;

    const nextBlocks = draft.blocks.map((b) => {
      if (b.id !== blockId) return b;

      const nextIndex = b.exercises.length + 1;
      const code = `${b.label}${nextIndex}`;

      const ex: DraftExercise = {
        id: createLocalId("ex"),
        code,
        title,
        trainerNote: "",
        sets: [
          {
            id: createLocalId("set"),
            setTypeId: null,
            repsTarget: null,
            tempo: null,
            restSeconds: null,
            orderIndex: 0,
          },
        ],
      };

      return { ...b, exercises: [...b.exercises, ex] };
    });

    queueSave({ ...draft, blocks: nextBlocks });
    setExercisePicker({ open: false, blockId: null });
  }

  function updateWorkoutTitle(value: string) {
    if (!draft) return;
    queueSave({ ...draft, title: value });
  }

  function updateTrainerNote(blockId: string, exerciseId: string, note: string) {
    if (!draft) return;

    const nextBlocks = draft.blocks.map((b) => {
      if (b.id !== blockId) return b;

      return {
        ...b,
        exercises: b.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, trainerNote: note } : ex
        ),
      };
    });

    queueSave({ ...draft, blocks: nextBlocks });
  }

  function addSet(blockId: string, exerciseId: string) {
    if (!draft) return;

    const nextBlocks = draft.blocks.map((b) => {
      if (b.id !== blockId) return b;

      return {
        ...b,
        exercises: b.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;

          const next: DraftSet = {
            id: createLocalId("set"),
            setTypeId: null,
            repsTarget: null,
            tempo: null,
            restSeconds: null,
            orderIndex: ex.sets.length,
          };

          return { ...ex, sets: [...ex.sets, next] };
        }),
      };
    });

    queueSave({ ...draft, blocks: nextBlocks });
  }

  function updateSet(
    blockId: string,
    exerciseId: string,
    setId: string,
    patch: Partial<DraftSet>
  ) {
    if (!draft) return;

    const nextBlocks = draft.blocks.map((b) => {
      if (b.id !== blockId) return b;

      return {
        ...b,
        exercises: b.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;

          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
          };
        }),
      };
    });

    queueSave({ ...draft, blocks: nextBlocks });
  }

  function openSetTypePicker(onPick: (id: string) => void) {
    setSetTypePicker({ open: true, onPick });
  }

  function getSetTypeTitle(id: string | null) {
    if (!id) return "Set Type";
    return setTypes.find((x) => x.id === id)?.title ?? "Set Type";
  }

  async function onDeleteDraft() {
    Alert.alert("Delete draft?", "This will remove the workout draft permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(`${STORAGE_PREFIX}${draftId}`);
          router.back();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textMuted }}>Loading draft...</Text>
      </View>
    );
  }

  if (!draft) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>
          Draft not found.
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            Workout Builder
          </Text>

          <TextInput
            value={draft.title}
            onChangeText={updateWorkoutTitle}
            placeholder="Workout title"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.titleInput,
              { color: theme.colors.text, borderColor: theme.colors.border },
            ]}
          />
        </View>

        <Pressable onPress={onDeleteDraft} style={styles.trashBtn}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
        </Pressable>
      </View>

      {/* Saving indicator */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
          {isSaving ? "Saving..." : "Saved ✓"}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 14 }}
      >
        {blocks.map((block) => (
          <Card
            key={block.id}
            style={[
              styles.blockCard,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.blockHeader}>
              <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700" }}>
                Block {block.label}
              </Text>

              <Button
                variant="ghost"
                onPress={() => openExercisePicker(block.id)}
              >
                + Add Exercise
              </Button>
            </View>

            <View style={{ height: 10 }} />

            {block.exercises.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted }}>
                No exercises yet. Add A1, A2...
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {block.exercises.map((ex) => (
                  <View
                    key={ex.id}
                    style={[
                      styles.exerciseCard,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.surface2 },
                    ]}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                      {ex.code} — {ex.title}
                    </Text>

                    <TextInput
                      value={ex.trainerNote}
                      onChangeText={(v) => updateTrainerNote(block.id, ex.id, v)}
                      placeholder="Trainer note (optional)"
                      placeholderTextColor={theme.colors.textMuted}
                      style={[
                        styles.noteInput,
                        { color: theme.colors.text, borderColor: theme.colors.border },
                      ]}
                    />

                    <View style={{ height: 10 }} />

                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                      Sets
                    </Text>

                    <View style={{ height: 8 }} />

                    <View style={{ gap: 8 }}>
                      {ex.sets.map((s) => (
                        <View
                          key={s.id}
                          style={[
                            styles.setRow,
                            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                          ]}
                        >
                          <Pressable
                            onPress={() =>
                              openSetTypePicker((pickedId) =>
                                updateSet(block.id, ex.id, s.id, { setTypeId: pickedId })
                              )
                            }
                            style={styles.setTypeBtn}
                          >
                            <Text style={{ color: theme.colors.text, fontSize: 13 }}>
                              {getSetTypeTitle(s.setTypeId)}
                            </Text>
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color={theme.colors.textMuted}
                            />
                          </Pressable>

                          <TextInput
                            value={s.repsTarget?.toString() ?? ""}
                            onChangeText={(v) =>
                              updateSet(block.id, ex.id, s.id, {
                                repsTarget: v ? Number(v) : null,
                              })
                            }
                            keyboardType="numeric"
                            placeholder="Reps"
                            placeholderTextColor={theme.colors.textMuted}
                            style={[
                              styles.smallInput,
                              { color: theme.colors.text, borderColor: theme.colors.border },
                            ]}
                          />

                          <TextInput
                            value={s.tempo ?? ""}
                            onChangeText={(v) =>
                              updateSet(block.id, ex.id, s.id, { tempo: v })
                            }
                            placeholder="Tempo"
                            placeholderTextColor={theme.colors.textMuted}
                            style={[
                              styles.smallInput,
                              { color: theme.colors.text, borderColor: theme.colors.border },
                            ]}
                          />

                          <TextInput
                            value={s.restSeconds?.toString() ?? ""}
                            onChangeText={(v) =>
                              updateSet(block.id, ex.id, s.id, {
                                restSeconds: v ? Number(v) : null,
                              })
                            }
                            keyboardType="numeric"
                            placeholder="Rest"
                            placeholderTextColor={theme.colors.textMuted}
                            style={[
                              styles.smallInput,
                              { color: theme.colors.text, borderColor: theme.colors.border },
                            ]}
                          />
                        </View>
                      ))}
                    </View>

                    <View style={{ height: 10 }} />

                    <Button variant="secondary" onPress={() => addSet(block.id, ex.id)}>
                      + Add Set
                    </Button>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}

        <Button variant="secondary" onPress={addBlock}>
          + Add Block
        </Button>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal transparent visible={exercisePicker.open} animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setExercisePicker({ open: false, blockId: null })}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onPress={() => {}}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700" }}>
              Pick an exercise
            </Text>

            <View style={{ height: 10 }} />

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {MOCK_EXERCISES.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    if (!exercisePicker.blockId) return;
                    addExerciseToBlock(exercisePicker.blockId, name);
                  }}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <Text style={{ color: theme.colors.text }}>{name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Set Type Picker Modal */}
      <Modal transparent visible={setTypePicker.open} animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSetTypePicker({ open: false, onPick: null })}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onPress={() => {}}
          >
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700" }}>
              Pick set type
            </Text>

            <View style={{ height: 10 }} />

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {setTypes.map((st) => (
                <Pressable
                  key={st.id}
                  onPress={() => {
                    setTypePicker.onPick?.(st.id);
                    setSetTypePicker({ open: false, onPick: null });
                  }}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <Text style={{ color: theme.colors.text }}>{st.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  titleInput: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  trashBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  blockCard: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  noteInput: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  setTypeBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  smallInput: {
    flex: 0.8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    padding: 14,
  },
  modalSheet: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
