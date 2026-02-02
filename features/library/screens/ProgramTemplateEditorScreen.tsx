import { RemoveCircleHalfDotIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
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

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutsByTrainer } from "@/features/builder/api/workouts.api";
import {
  addPhase,
  addPhaseWeek,
  archiveProgramTemplate,
  deleteProgramTemplate,
  duplicateProgramTemplate,
  fetchProgramTemplateById,
  removePhase,
  removePhaseWeek,
  removeWorkoutFromDayAt,
  setDayWorkoutFromTable,
  updateProgramTemplate,
} from "@/features/library/api/programTemplates.api";
import { ChooseFromWorkoutsSheet } from "@/features/library/components/program-templates/ChooseFromWorkoutsSheet";
import { DayPlannerSheet } from "@/features/library/components/program-templates/DayPlannerSheet";
import type {
  ProgramDay,
  ProgramDifficulty,
  ProgramTemplate,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { PROGRAM_DIFFICULTIES } from "@/features/library/types/programTemplate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  Button,
  Chip,
  Icon,
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
  const trainerId = useAppSelector((s) => s.auth.userId ?? "");
  const params = useLocalSearchParams<{ programId: string }>();
  const programId = params.programId ?? "";

  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>("beginner");
  const [state, setState] = useState<ProgramTemplateState | null>(null);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [dayPlannerOpen, setDayPlannerOpen] = useState<{
    phaseIndex: number;
    weekIndex: number;
    dayOrder: number;
  } | null>(null);
  const [chooseWorkoutsOpen, setChooseWorkoutsOpen] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workoutRowsMap, setWorkoutRowsMap] = useState<
    Record<string, WorkoutRow>
  >({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phaseCount = state?.phases?.length ?? 0;
  const clampedPhaseIndex = Math.min(
    Math.max(0, selectedPhaseIndex),
    Math.max(0, phaseCount - 1)
  );
  const currentPhase = state?.phases?.[clampedPhaseIndex] ?? null;
  const phaseWeeksCount = currentPhase?.weeks?.length ?? 0;
  const clampedWeekIndex = Math.min(
    Math.max(0, selectedWeekIndex),
    Math.max(0, phaseWeeksCount - 1)
  );
  const currentWeek = currentPhase?.weeks?.[clampedWeekIndex] ?? null;
  const durationWeeks = state?.durationWeeks ?? 0;

  const getDayWorkoutTitles = useCallback(
    (day: ProgramDay): string[] => {
      const list = day.workouts ?? (day.workoutRef ? [day.workoutRef] : []);
      return list.map((ref) => {
        if (!ref) return "Workout";
        if (ref.source === "workoutsTable")
          return workoutRowsMap[ref.workoutId]?.title ?? "Workout";
        const inline = state?.workoutLibrary?.inlineWorkouts?.find(
          (w) => w.id === ref.inlineWorkoutId
        );
        return inline?.title ?? "Workout";
      });
    },
    [workoutRowsMap, state?.workoutLibrary?.inlineWorkouts]
  );

  const persist = useCallback(
    async (patch: {
      title?: string;
      difficulty?: ProgramDifficulty;
      state?: ProgramTemplateState;
    }) => {
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
        }
        appToast.error(e instanceof Error ? e.message : "Failed to save");
      }
    },
    [programId]
  );

  const schedulePersist = useCallback(
    (patch: {
      title?: string;
      difficulty?: ProgramDifficulty;
      state?: ProgramTemplateState;
    }) => {
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
        const [row, workouts] = await Promise.all([
          fetchProgramTemplateById(programId),
          trainerId ? fetchWorkoutsByTrainer(trainerId) : Promise.resolve([]),
        ]);
        if (!mounted) return;
        if (!row) {
          setError("Program not found");
          setTemplate(null);
          setState(null);
          setLoading(false);
          return;
        }
        setTemplate(row);
        setTitle(row.title);
        setDifficulty(row.difficulty);
        setState(row.state);
        setSelectedWeekIndex(0);
        const ids = row.state?.workoutLibrary?.linkedWorkoutIds ?? [];
        const map: Record<string, WorkoutRow> = {};
        workouts.forEach((w) => {
          if (ids.includes(w.id)) map[w.id] = w;
        });
        setWorkoutRowsMap(map);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setTemplate(null);
        setState(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [programId, trainerId]);

  const handleTitleBlur = () => {
    if (title.trim().length >= 2) schedulePersist({ title: title.trim() });
  };

  const handleDifficultyChange = (d: ProgramDifficulty) => {
    setDifficulty(d);
    schedulePersist({ difficulty: d });
  };

  const handleAddPhase = () => {
    if (!state) return;
    const next = addPhase(state);
    setState(next);
    schedulePersist({ state: next });
    setSelectedPhaseIndex(next.phases.length - 1);
    setSelectedWeekIndex(0);
  };

  const handleAddWeek = () => {
    if (!state) return;
    const next = addPhaseWeek(state, clampedPhaseIndex);
    setState(next);
    schedulePersist({ state: next });
    const newLen = next.phases[clampedPhaseIndex]?.weeks.length ?? 0;
    setSelectedWeekIndex(Math.max(0, newLen - 1));
  };

  const handleRemoveWeek = () => {
    if (!state) return;
    const next = removePhaseWeek(state, clampedPhaseIndex);
    setState(next);
    schedulePersist({ state: next });
    const newLen = next.phases[clampedPhaseIndex]?.weeks.length ?? 0;
    setSelectedWeekIndex(Math.min(clampedWeekIndex, Math.max(0, newLen - 1)));
  };

  const handleAddWorkoutToDay = (workoutId: string) => {
    if (!state || !dayPlannerOpen) return;
    const next = setDayWorkoutFromTable(
      state,
      dayPlannerOpen.phaseIndex,
      dayPlannerOpen.weekIndex,
      dayPlannerOpen.dayOrder,
      workoutId
    );
    setState(next);
    schedulePersist({ state: next });
    setChooseWorkoutsOpen(false);
    setReplaceMode(false);
    fetchWorkoutsByTrainer(trainerId).then((list) => {
      const row = list.find((w) => w.id === workoutId);
      if (row) setWorkoutRowsMap((prev) => ({ ...prev, [workoutId]: row }));
    });
  };

  const handleRemoveWorkoutFromDayAt = (workoutIndex: number) => {
    if (!state || !dayPlannerOpen) return;
    const next = removeWorkoutFromDayAt(
      state,
      dayPlannerOpen.phaseIndex,
      dayPlannerOpen.weekIndex,
      dayPlannerOpen.dayOrder,
      workoutIndex
    );
    setState(next);
    schedulePersist({ state: next });
  };

  const handleRemovePhase = () => {
    if (!state || phaseCount <= 1) return;
    const next = removePhase(state, clampedPhaseIndex);
    setState(next);
    schedulePersist({ state: next });
    setSelectedPhaseIndex(Math.min(clampedPhaseIndex, next.phases.length - 1));
  };

  const handleReplaceWorkout = () => {
    setReplaceMode(true);
    setChooseWorkoutsOpen(true);
  };

  const handleDuplicate = async () => {
    setMenuOpen(false);
    try {
      const created = await duplicateProgramTemplate(programId);
      appToast.success(t("library.programsScreen.menuDuplicate") + " – done");
      router.replace(
        `/(trainer)/library/program-templates/${created.id}` as Parameters<
          typeof router.replace
        >[0]
      );
    } catch (e: unknown) {
      appToast.error(e instanceof Error ? e.message : "Duplicate failed");
    }
  };

  const handleArchive = () => {
    setMenuOpen(false);
    alert.confirm({
      title: t(
        "library.programsScreen.archiveConfirm",
        "Archive this program?"
      ),
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
      title: t(
        "library.programsScreen.deleteConfirm",
        "Delete this program? This cannot be undone."
      ),
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
      <View
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.headerBar,
            { paddingTop: 10, backgroundColor: theme.colors.background },
          ]}
        >
          <Button
            variant="icon"
            height={36}
            onPress={() => router.back()}
            left={
              <Icon name="chevron-back" size={22} color={theme.colors.text} />
            }
          />
          <Text
            style={[
              styles.headerTitlePlaceholder,
              { color: theme.colors.textMuted },
            ]}
          >
            …
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </View>
    );
  }

  if (error || !template || !state) {
    return (
      <View
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.headerBar,
            { paddingTop: 10, backgroundColor: theme.colors.background },
          ]}
        >
          <Button
            variant="icon"
            height={36}
            onPress={() => router.back()}
            left={
              <Icon name="chevron-back" size={22} color={theme.colors.text} />
            }
          />
          <Text
            style={[
              styles.headerTitlePlaceholder,
              { color: theme.colors.text },
            ]}
          >
            Program
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.danger }}>
            {error ?? "Not found"}
          </Text>
        </View>
      </View>
    );
  }

  const plannerPhase =
    dayPlannerOpen != null ? state?.phases?.[dayPlannerOpen.phaseIndex] : null;
  const openDay =
    dayPlannerOpen && plannerPhase
      ? plannerPhase.weeks[dayPlannerOpen.weekIndex]?.days.find(
          (d) => d.order === dayPlannerOpen.dayOrder
        )
      : null;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Header: back + editable title + cog */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: 10, backgroundColor: theme.colors.background },
        ]}
      >
        <Button
          variant="icon"
          height={40}
          onPress={() => router.back()}
          left={
            <Icon name="chevron-back" size={24} color={theme.colors.text} />
          }
        />
        <TextInput
          value={title}
          onChangeText={setTitle}
          onBlur={handleTitleBlur}
          placeholder={t(
            "library.createProgram.titlePlaceholder",
            "Program name"
          )}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.headerTitleInput, { color: theme.colors.text }]}
          maxLength={100}
        />
        <Button
          variant="icon"
          height={40}
          onPress={() => setMenuOpen(true)}
          left={<Icon name="cog" size={22} color={theme.colors.text} />}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Difficulty: no divider */}
        <View style={styles.difficultyRow}>
          {PROGRAM_DIFFICULTIES.map((d) => (
            <View key={d} style={styles.difficultyChipWrap}>
              <Chip
                label={t(DIFFICULTY_KEYS[d])}
                isActive={difficulty === d}
                onPress={() => handleDifficultyChange(d)}
                style={styles.difficultyChipFlex}
              />
            </View>
          ))}
        </View>

        {/* Phases: divider below */}
        {phaseCount > 0 && (
          <View
            style={[
              styles.compactSection,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text
              weight="semibold"
              style={[styles.compactLabel, { color: theme.colors.textMuted }]}
            >
              {t("library.programsScreen.phase", "Phase")}
            </Text>
            <View style={styles.tabRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.phaseScrollView}
                contentContainerStyle={styles.phaseScroll}
              >
                {state.phases.map((phase, i) => (
                  <Pressable
                    key={phase.id}
                    onPress={() => setSelectedPhaseIndex(i)}
                    style={({ pressed }) => [
                      styles.compactTab,
                      {
                        backgroundColor:
                          clampedPhaseIndex === i
                            ? theme.colors.accent
                            : hexToRgba(theme.colors.text, 0.06),
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.compactTabText,
                        {
                          color:
                            clampedPhaseIndex === i
                              ? theme.colors.background
                              : theme.colors.text,
                        },
                      ]}
                    >
                      {phase.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.phaseControlsVertical}>
                <Pressable
                  onPress={handleRemovePhase}
                  disabled={phaseCount <= 1}
                  style={({ pressed }) => [
                    styles.iconBtnTiny,
                    { opacity: phaseCount <= 1 ? 0.5 : pressed ? 0.8 : 1 },
                  ]}
                >
                  <HugeiconsIcon
                    icon={RemoveCircleHalfDotIcon}
                    size={18}
                    color={theme.colors.text}
                  />
                </Pressable>
                <Pressable
                  onPress={handleAddPhase}
                  style={({ pressed }) => [
                    styles.iconBtnTiny,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Icon
                    name="add-circle-outline"
                    size={18}
                    color={theme.colors.accent}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Weeks: divider below */}
        <View
          style={[
            styles.compactSection,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <Text
            weight="semibold"
            style={[styles.compactLabel, { color: theme.colors.textMuted }]}
          >
            {t("library.programsScreen.weeksSection", "Weeks")}
          </Text>
          <View style={styles.tabRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.phaseScrollView}
              contentContainerStyle={styles.phaseScroll}
            >
              {currentPhase?.weeks.map((w, i) => (
                <Pressable
                  key={w.index}
                  onPress={() => setSelectedWeekIndex(i)}
                  style={({ pressed }) => [
                    styles.compactTab,
                    {
                      backgroundColor:
                        clampedWeekIndex === i
                          ? theme.colors.accent
                          : hexToRgba(theme.colors.text, 0.06),
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.compactTabText,
                      {
                        color:
                          clampedWeekIndex === i
                            ? theme.colors.background
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {w.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.phaseControlsVertical}>
              <Pressable
                onPress={handleRemoveWeek}
                disabled={phaseWeeksCount <= 1}
                style={({ pressed }) => [
                  styles.iconBtnTiny,
                  { opacity: phaseWeeksCount <= 1 ? 0.5 : pressed ? 0.8 : 1 },
                ]}
              >
                <HugeiconsIcon
                  icon={RemoveCircleHalfDotIcon}
                  size={18}
                  color={theme.colors.text}
                />
              </Pressable>
              <Pressable
                onPress={handleAddWeek}
                disabled={phaseWeeksCount >= 52}
                style={({ pressed }) => [
                  styles.iconBtnTiny,
                  { opacity: phaseWeeksCount >= 52 ? 0.5 : pressed ? 0.8 : 1 },
                ]}
              >
                <Icon
                  name="add-circle-outline"
                  size={18}
                  color={theme.colors.accent}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Week schedule (Days): divider below */}
        {currentWeek && (
          <View
            style={[
              styles.section,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text
              weight="semibold"
              style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
            >
              {currentPhase?.title} · {currentWeek.label}
            </Text>
            <View style={styles.daysList}>
              {currentWeek.days.map((day) => {
                const titles = getDayWorkoutTitles(day);
                const dayLabel = DAY_LABELS[day.order] ?? day.label;
                const hasWorkouts = titles.length > 0;
                return (
                  <Pressable
                    key={day.id}
                    onPress={() =>
                      setDayPlannerOpen({
                        phaseIndex: clampedPhaseIndex,
                        weekIndex: clampedWeekIndex,
                        dayOrder: day.order,
                      })
                    }
                    style={({ pressed }) => [
                      styles.dayRow,
                      {
                        backgroundColor:
                          theme.colors.surface3 ?? theme.colors.background,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <Text
                      weight="semibold"
                      style={[
                        styles.dayRowLabel,
                        { color: theme.colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {dayLabel}
                    </Text>
                    <View style={styles.dayRowChips}>
                      {!hasWorkouts ? (
                        <View
                          style={[
                            styles.workoutChip,
                            {
                              backgroundColor: hexToRgba(
                                theme.colors.textMuted,
                                0.12
                              ),
                            },
                          ]}
                        >
                          <Icon
                            name="barbell-outline"
                            size={14}
                            color={theme.colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.workoutChipText,
                              { color: theme.colors.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {t(
                              "library.programsScreen.addWorkoutDay",
                              "Add workout"
                            )}
                          </Text>
                        </View>
                      ) : (
                        titles.map((workoutTitle, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.workoutChip,
                              {
                                backgroundColor: hexToRgba(
                                  theme.colors.accent,
                                  0.15
                                ),
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.workoutChipText,
                                { color: theme.colors.text },
                              ]}
                              numberOfLines={1}
                            >
                              {workoutTitle}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Settings menu modal */}
      <Modal visible={menuOpen} transparent animationType="fade">
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.colors.surface2 },
            ]}
          >
            <Pressable
              style={[
                styles.menuItem,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={handleDuplicate}
            >
              <Text style={{ color: theme.colors.text }}>
                {t("library.programsScreen.menuDuplicate")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.menuItem,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={handleArchive}
            >
              <Text style={{ color: theme.colors.text }}>
                {t("library.programsScreen.menuArchive")}
              </Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Text style={{ color: theme.colors.danger }}>
                {t("library.programsScreen.menuDelete")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <DayPlannerSheet
        visible={dayPlannerOpen !== null}
        weekIndex={dayPlannerOpen?.weekIndex ?? 0}
        dayLabel={openDay ? DAY_LABELS[openDay.order] ?? openDay.label : "Day"}
        day={openDay ?? null}
        state={state}
        workoutRowsMap={workoutRowsMap}
        onClose={() => setDayPlannerOpen(null)}
        onAddWorkout={() => {
          setReplaceMode(false);
          setChooseWorkoutsOpen(true);
        }}
        onRemoveWorkoutAt={handleRemoveWorkoutFromDayAt}
      />

      <ChooseFromWorkoutsSheet
        visible={chooseWorkoutsOpen}
        onClose={() => setChooseWorkoutsOpen(false)}
        onSelectWorkout={(workoutId) => handleAddWorkoutToDay(workoutId)}
        pendingDay={
          dayPlannerOpen
            ? {
                programId,
                phaseIndex: dayPlannerOpen.phaseIndex,
                weekIndex: dayPlannerOpen.weekIndex,
                dayOrder: dayPlannerOpen.dayOrder,
              }
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 10,
    gap: 10,
  },
  headerTitleInput: {
    flex: 1,
    fontSize: 19,
    fontWeight: "600",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  headerTitlePlaceholder: {
    flex: 1,
    fontSize: 19,
    fontWeight: "600",
    paddingVertical: 10,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 40 },
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
    paddingBottom: 6,
    gap: 8,
  },
  difficultyChipWrap: { flex: 1 },
  difficultyChipFlex: {
    marginRight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  compactSection: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 4,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  compactLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 0,
    marginTop: 0,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 0,
  },
  section: {
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 0,
    marginTop: 0,
  },
  phaseScroll: { flexDirection: "row", gap: 8, paddingRight: 6 },
  phaseScrollView: { flex: 1 },
  compactTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  compactTabText: { fontSize: 13, fontWeight: "600" },
  phaseControlsVertical: {
    flexDirection: "column",
    gap: 2,
  },
  iconBtnTiny: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  daysList: { gap: 6, marginTop: 0 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  dayRowLabel: {
    fontSize: 13,
    width: 32,
  },
  dayRowChips: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  workoutChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: "100%",
  },
  workoutChipText: { fontSize: 12, fontWeight: "500", flexShrink: 1 },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuCard: { borderRadius: 20, minWidth: 240, overflow: "hidden" },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
});
