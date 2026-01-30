import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  archiveProgramTemplate,
  deleteProgramTemplate,
  duplicateProgramTemplate,
  fetchProgramTemplateById,
  updateProgramTemplate,
} from "@/features/library/api/programTemplates.api";
import { DayPlannerSheet } from "@/features/library/components/program-templates/DayPlannerSheet";
import { ChooseFromWorkoutsSheet } from "@/features/library/components/program-templates/ChooseFromWorkoutsSheet";
import type {
  DayState,
  DayWorkout,
  ProgramDifficulty,
  ProgramTemplate,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { PROGRAM_DIFFICULTIES, STATE_VERSION } from "@/features/library/types/programTemplate";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";
import {
  Button,
  Chip,
  Icon,
  StickyHeader,
  Text,
  useAppAlert,
  useTheme,
} from "@/shared/ui";

const DIFFICULTY_KEYS: Record<ProgramDifficulty, string> = {
  beginner: "library.programsScreen.difficultyBeginner",
  intermediate: "library.programsScreen.difficultyIntermediate",
  advanced: "library.programsScreen.difficultyAdvanced",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEBOUNCE_MS = 600;

export default function ProgramTemplateEditorScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const params = useLocalSearchParams<{ programId: string }>();
  const programId = params.programId ?? "";

  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>("beginner");
  const [state, setState] = useState<ProgramTemplateState>({ version: STATE_VERSION, weeks: [] });
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0); // 0-based index into state.weeks
  const [dayPlannerOpen, setDayPlannerOpen] = useState<{ weekIndex: number; dayIndex: number } | null>(null);
  const [chooseWorkoutsOpen, setChooseWorkoutsOpen] = useState(false);
  const [replaceAtIndex, setReplaceAtIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (patch: { title?: string; difficulty?: ProgramDifficulty; state?: ProgramTemplateState }) => {
      if (!programId) return;
      try {
        const updated = await updateProgramTemplate(programId, patch);
        setTemplate(updated);
        setTitle(updated.title);
        setDifficulty(updated.difficulty);
        setState(updated.state);
      } catch (e: unknown) {
        if (__DEV__) {
          console.warn("[ProgramTemplateEditor] update failed:", e);
          if (e && typeof e === "object" && "message" in e) {
            console.warn("[ProgramTemplateEditor] error.message:", (e as { message?: string }).message);
          }
        }
        appToast.error(e instanceof Error ? e.message : "Failed to save");
      }
    },
    [programId]
  );

  const schedulePersist = useCallback(
    (patch: { title?: string; difficulty?: ProgramDifficulty; state?: ProgramTemplateState }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void persist(patch);
      }, DEBOUNCE_MS);
    },
    [persist]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!programId) {
        setError("Missing program");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const row = await fetchProgramTemplateById(programId);
        if (!mounted) return;
        if (!row) {
          setError("Program not found");
          setTemplate(null);
          setLoading(false);
          return;
        }
        setTemplate(row);
        setTitle(row.title);
        setDifficulty(row.difficulty);
        setState(row.state);
        setSelectedWeekIndex(0);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setTemplate(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [programId]);

  const currentWeek = state.weeks[selectedWeekIndex] ?? null;
  const durationWeeks = state.weeks.length;

  const handleTitleBlur = () => {
    if (title.trim().length >= 2) schedulePersist({ title: title.trim() });
  };

  const handleDifficultyChange = (d: ProgramDifficulty) => {
    setDifficulty(d);
    schedulePersist({ difficulty: d });
  };

  const handleAddWeek = () => {
    const newWeekIndex = state.weeks.length + 1;
    const newWeek: { weekIndex: number; days: DayState[] } = {
      weekIndex: newWeekIndex,
      days: Array.from({ length: 7 }, (_, i) => ({ dayIndex: i + 1, workouts: [] })),
    };
    const newWeeks = [...state.weeks, newWeek];
    setState({ version: state.version, weeks: newWeeks });
    schedulePersist({
      state: { version: state.version, weeks: newWeeks },
    });
    setTemplate((prev) =>
      prev ? { ...prev, durationWeeks: newWeeks.length, state: { version: state.version, weeks: newWeeks } } : null
    );
    setSelectedWeekIndex(newWeeks.length - 1);
  };

  const handleRemoveWeek = () => {
    if (state.weeks.length <= 1) return;
    const newWeeks = state.weeks.slice(0, -1);
    setState({ version: state.version, weeks: newWeeks });
    schedulePersist({
      state: { version: state.version, weeks: newWeeks },
    });
    setTemplate((prev) =>
      prev ? { ...prev, durationWeeks: newWeeks.length, state: { version: state.version, weeks: newWeeks } } : null
    );
    setSelectedWeekIndex(Math.min(selectedWeekIndex, newWeeks.length - 1));
  };

  const getDayForWeek = (weekIndex: number, dayIndex: number): DayState | null => {
    const week = state.weeks.find((w) => w.weekIndex === weekIndex);
    return week?.days.find((d) => d.dayIndex === dayIndex) ?? null;
  };

  const updateDayWorkouts = useCallback(
    (weekIndex: number, dayIndex: number, workouts: DayWorkout[]) => {
      const newWeeks = state.weeks.map((w) => {
        if (w.weekIndex !== weekIndex) return w;
        return {
          ...w,
          days: w.days.map((d) =>
            d.dayIndex === dayIndex ? { ...d, workouts } : d
          ),
        };
      });
      setState({ version: state.version, weeks: newWeeks });
      schedulePersist({ state: { version: state.version, weeks: newWeeks } });
    },
    [state.weeks, state.version, schedulePersist]
  );

  const handleAddWorkoutToDay = (workoutId: string, workoutTitle: string) => {
    if (!dayPlannerOpen) return;
    const day = getDayForWeek(dayPlannerOpen.weekIndex, dayPlannerOpen.dayIndex);
    const current = day?.workouts ?? [];
    const newWorkout = { workoutId, source: "workouts" as const, title: workoutTitle };
    let next: DayWorkout[];
    if (replaceAtIndex !== null && replaceAtIndex >= 0 && replaceAtIndex < current.length) {
      next = current.map((w, i) => (i === replaceAtIndex ? newWorkout : w));
      setReplaceAtIndex(null);
    } else {
      next = [...current, newWorkout];
    }
    updateDayWorkouts(dayPlannerOpen.weekIndex, dayPlannerOpen.dayIndex, next);
    setChooseWorkoutsOpen(false);
  };

  const handleReplaceWorkoutInDay = (index: number) => {
    setReplaceAtIndex(index);
    setChooseWorkoutsOpen(true);
  };

  const handleRemoveWorkoutFromDay = (index: number) => {
    if (!dayPlannerOpen) return;
    const day = getDayForWeek(dayPlannerOpen.weekIndex, dayPlannerOpen.dayIndex);
    const current = day?.workouts ?? [];
    const next = current.filter((_, i) => i !== index);
    updateDayWorkouts(dayPlannerOpen.weekIndex, dayPlannerOpen.dayIndex, next);
  };

  const handleDuplicate = async () => {
    setMenuOpen(false);
    try {
      const created = await duplicateProgramTemplate(programId);
      appToast.success(t("library.programsScreen.menuDuplicate") + " – done");
      router.replace(
        `/(trainer)/library/program-templates/${created.id}` as Parameters<typeof router.replace>[0]
      );
    } catch (e: unknown) {
      appToast.error(e instanceof Error ? e.message : "Duplicate failed");
    }
  };

  const handleArchive = () => {
    setMenuOpen(false);
    alert.confirm({
      title: t("library.programsScreen.archiveConfirm", "Archive this program?"),
      confirmText: t("library.programsScreen.menuArchive", "Archive"),
      cancelText: t("common.cancel", "Cancel"),
      onConfirm: async () => {
        await archiveProgramTemplate(programId);
        appToast.success("Archived");
        router.back();
      },
    });
  };

  const handleDelete = () => {
    setMenuOpen(false);
    alert.confirm({
      title: t("library.programsScreen.deleteConfirm", "Delete this program? This cannot be undone."),
      confirmText: t("library.programsScreen.menuDelete", "Delete"),
      cancelText: t("common.cancel", "Cancel"),
      destructive: true,
      onConfirm: async () => {
        await deleteProgramTemplate(programId);
        appToast.success("Deleted");
        router.back();
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <StickyHeader title="…" showBackButton />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </View>
    );
  }

  if (error || !template) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <StickyHeader title="Program" showBackButton />
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.danger }}>{error ?? "Not found"}</Text>
        </View>
      </View>
    );
  }

  const dayPlannerDay = dayPlannerOpen
    ? getDayForWeek(dayPlannerOpen.weekIndex, dayPlannerOpen.dayIndex)
    : null;
  const dayPlannerWorkouts = dayPlannerDay?.workouts ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader
        title=""
        showBackButton
        rightButton={{
          icon: <Icon name="ellipsis-vertical" size={22} color={theme.colors.text} />,
          variant: "icon",
          onPress: () => setMenuOpen(true),
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Inline title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          onBlur={handleTitleBlur}
          placeholder={t("library.createProgram.titlePlaceholder", "Program name")}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.titleInput, { color: theme.colors.text }]}
          maxLength={100}
        />

        {/* Difficulty pill row */}
        <View style={[styles.pillRow, { marginTop: theme.spacing.sm }]}>
          {PROGRAM_DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              label={t(DIFFICULTY_KEYS[d])}
              isActive={difficulty === d}
              onPress={() => handleDifficultyChange(d)}
              style={styles.difficultyChip}
            />
          ))}
        </View>

        {/* Week tabs + duration controls */}
        <View style={[styles.weekRow, { borderBottomColor: theme.colors.border, marginTop: theme.spacing.lg }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekScroll}>
            {state.weeks.map((w, i) => (
              <Pressable
                key={w.weekIndex}
                onPress={() => setSelectedWeekIndex(i)}
                style={[
                  styles.weekTab,
                  {
                    backgroundColor: selectedWeekIndex === i ? theme.colors.accent : theme.colors.surface2,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.weekTabText,
                    { color: selectedWeekIndex === i ? theme.colors.background : theme.colors.text },
                  ]}
                >
                  Week {w.weekIndex}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.weekControls}>
            <Pressable
              onPress={handleRemoveWeek}
              disabled={durationWeeks <= 1}
              style={({ pressed }) => [styles.weekBtn, { opacity: durationWeeks <= 1 ? 0.5 : pressed ? 0.8 : 1 }]}
            >
              <Icon name="remove" size={20} color={theme.colors.text} />
            </Pressable>
            <Pressable
              onPress={handleAddWeek}
              disabled={durationWeeks >= 52}
              style={({ pressed }) => [styles.weekBtn, { opacity: durationWeeks >= 52 ? 0.5 : pressed ? 0.8 : 1 }]}
            >
              <Icon name="add" size={20} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* 7 day cards for selected week */}
        {currentWeek && (
          <View style={[styles.daysGrid, { marginTop: theme.spacing.lg, gap: theme.spacing.md }]}>
            {currentWeek.days.map((day) => {
              const workoutCount = day.workouts.length;
              const firstTwo = day.workouts.slice(0, 2);
              const more = workoutCount > 2 ? workoutCount - 2 : 0;
              const dayLabel = DAY_LABELS[day.dayIndex - 1] ?? `Day ${day.dayIndex}`;
              return (
                <Pressable
                  key={day.dayIndex}
                  onPress={() => setDayPlannerOpen({ weekIndex: currentWeek.weekIndex, dayIndex: day.dayIndex })}
                  style={({ pressed }) => [
                    styles.dayCard,
                    {
                      backgroundColor: theme.colors.surface2,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.95 : 1,
                    },
                  ]}
                >
                  <Text weight="semibold" style={[styles.dayLabel, { color: theme.colors.textMuted }]}>
                    {dayLabel}
                  </Text>
                  {workoutCount === 0 ? (
                    <Text style={[styles.dayHint, { color: theme.colors.textMuted }]}>Add workout</Text>
                  ) : (
                    <>
                      {firstTwo.map((w, i) => (
                        <Text key={`${w.workoutId}-${i}`} numberOfLines={1} style={[styles.dayWorkout, { color: theme.colors.text }]}>
                          {w.title ?? "Workout"}
                        </Text>
                      ))}
                      {more > 0 && (
                        <Text style={[styles.dayMore, { color: theme.colors.textMuted }]}>+{more} more</Text>
                      )}
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 3-dot menu modal */}
      <Modal visible={menuOpen} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuCard, { backgroundColor: theme.colors.surface2 }]}>
            <Pressable style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={handleDuplicate}>
              <Text style={{ color: theme.colors.text }}>{t("library.programsScreen.menuDuplicate")}</Text>
            </Pressable>
            <Pressable style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={handleArchive}>
              <Text style={{ color: theme.colors.text }}>{t("library.programsScreen.menuArchive")}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Text style={{ color: theme.colors.danger }}>{t("library.programsScreen.menuDelete")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <DayPlannerSheet
        visible={dayPlannerOpen !== null}
        weekIndex={dayPlannerOpen?.weekIndex ?? 1}
        dayIndex={dayPlannerOpen?.dayIndex ?? 1}
        workouts={dayPlannerWorkouts}
        onClose={() => setDayPlannerOpen(null)}
        onAddWorkout={() => {
          setReplaceAtIndex(null);
          setChooseWorkoutsOpen(true);
        }}
        onRemoveWorkout={handleRemoveWorkoutFromDay}
        onReplaceWorkout={handleReplaceWorkoutInDay}
      />

      <ChooseFromWorkoutsSheet
        visible={chooseWorkoutsOpen}
        onClose={() => setChooseWorkoutsOpen(false)}
        onSelectWorkout={handleAddWorkoutToDay}
        pendingDay={
          dayPlannerOpen
            ? { programId, weekIndex: dayPlannerOpen.weekIndex, dayIndex: dayPlannerOpen.dayIndex }
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  titleInput: {
    fontSize: 22,
    fontWeight: "700",
    paddingVertical: 4,
  },
  pillRow: { flexDirection: "row", gap: 8 },
  difficultyChip: { marginRight: 0 },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  weekScroll: { flex: 1, flexDirection: "row", gap: 8, paddingRight: 8 },
  weekTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  weekTabText: { fontSize: 14, fontWeight: "600" },
  weekControls: { flexDirection: "row", gap: 4 },
  weekBtn: { padding: 8 },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCard: {
    width: "47%",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 80,
  },
  dayLabel: { fontSize: 12, marginBottom: 4 },
  dayHint: { fontSize: 14 },
  dayWorkout: { fontSize: 13, marginTop: 2 },
  dayMore: { fontSize: 12, marginTop: 2 },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuCard: {
    borderRadius: 16,
    minWidth: 200,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
});
