import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";

import { ChooseFromWorkoutsSheet } from "@/features/library/components/programs/programsPage/components/ChooseFromWorkoutsSheet";
import { DayPlannerSheet } from "@/features/library/components/programs/programsPage/components/dayPlanner/DayPlannerSheet";
import { ProgramTemplateCarouselBackdrop } from "@/features/library/components/programs/programsPage/programTemplateEditor/components/ProgramTemplateCarouselBackdrop";
import { ProgramTemplateDifficultyRow } from "@/features/library/components/programs/programsPage/programTemplateEditor/components/ProgramTemplateDifficultyRow";
import { ProgramTemplateDragOverlays } from "@/features/library/components/programs/programsPage/programTemplateEditor/components/ProgramTemplateDragOverlays";
import { ProgramTemplateEditorDaysSection } from "@/features/library/components/programs/programsPage/programTemplateEditor/components/ProgramTemplateEditorDaysSection";
import { ProgramTemplateEditorHeader } from "@/features/library/components/programs/programsPage/programTemplateEditor/components/ProgramTemplateEditorHeader";
import { ProgramTemplateEditorMenuModal } from "@/features/library/components/programs/programsPage/programTemplateEditor/components/ProgramTemplateEditorMenuModal";
import { ProgramTemplateEditorPhaseSection } from "@/features/library/components/programs/programsPage/programTemplateEditor/components/ProgramTemplateEditorPhaseSection";
import { ProgramTemplateEditorWeekSection } from "@/features/library/components/programs/programsPage/programTemplateEditor/components/ProgramTemplateEditorWeekSection";
import {
  DAY_LABELS,
  PHASE_SLOT_W,
  WEEK_SLOT_W,
} from "@/features/library/components/programs/programsPage/programTemplateEditor/constants";
import { useProgramTemplateEditorActions } from "@/features/library/components/programs/programsPage/programTemplateEditor/hooks/useProgramTemplateEditorActions";
import { useProgramTemplateEditorData } from "@/features/library/components/programs/programsPage/programTemplateEditor/hooks/useProgramTemplateEditorData";
import { useProgramTemplateEditorDrag } from "@/features/library/components/programs/programsPage/programTemplateEditor/hooks/useProgramTemplateEditorDrag";
import { useWeekPillColors } from "@/features/library/components/programs/programsPage/programTemplateEditor/hooks/useWeekPillColors";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Text, useAppAlert, useTheme } from "@/shared/ui";

// Note: any animated wrappers are defined in section components.

export default function ProgramTemplateEditorScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const trainerId = useAppSelector((s) => s.auth.userId ?? "");
  const params = useLocalSearchParams<{ programId: string }>();
  const programId = params.programId ?? "";

  const {
    template,
    loading,
    error,
    title,
    setTitle,
    difficulty,
    setDifficulty,
    state,
    setState,
    workoutRowsMap,
    setWorkoutRowsMap,
    schedulePersist,
  } = useProgramTemplateEditorData({ programId, trainerId });
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [dayPlannerOpen, setDayPlannerOpen] = useState<{
    phaseIndex: number;
    weekIndex: number;
    dayOrder: number;
  } | null>(null);
  const [chooseWorkoutsOpen, setChooseWorkoutsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Note: persistence is handled by useProgramTemplateEditorData()

  useEffect(() => {
    // When navigating to a different template, reset selection.
    setSelectedPhaseIndex(0);
    setSelectedWeekIndex(0);
  }, [programId]);

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

  const weekPillColorByIndex = useWeekPillColors(currentPhase?.weeks);
  const actions = useProgramTemplateEditorActions({
    programId,
    trainerId,
    title,
    difficulty,
    setDifficulty,
    state: state as any,
    setState: setState as any,
    schedulePersist,
    workoutRowsMap,
    setWorkoutRowsMap,
    clampedPhaseIndex,
    clampedWeekIndex,
    phaseCount,
    currentPhase: currentPhase as any,
    currentWeek: currentWeek as any,
    setSelectedPhaseIndex,
    setSelectedWeekIndex,
    dayPlannerOpen,
    setChooseWorkoutsOpen,
    setMenuOpen,
    confirm: alert.confirm,
    t: (key, fallback, vars) =>
      String(t(key as any, fallback as any, vars as any)),
  });

  const drag = useProgramTemplateEditorDrag({
    onMoveWorkoutToDay: actions.moveWorkoutToDay,
    onCommitPhaseDrop: actions.commitPhaseDrop,
    onCommitWeekDrop: actions.commitWeekDrop,
    phaseCount,
    weekCount: currentPhase?.weeks?.length ?? 0,
  });

  if (loading) {
    return (
      <View
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <ProgramTemplateEditorHeader variant="loading" />
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
        <ProgramTemplateEditorHeader variant="error" message={error} />
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
    <GestureHandlerRootView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <GestureDetector gesture={drag.globalPanGesture}>
        <View
          ref={drag.rootContainerRef}
          style={styles.screen}
          collapsable={false}
          onLayout={() => {
            drag.rootContainerRef.current?.measureInWindow((x, y) => {
              drag.rootLayoutRef.current = { x, y };
            });
          }}
        >
          <ProgramTemplateEditorHeader
            variant="normal"
            title={title}
            onChangeTitle={setTitle}
            onBlurTitle={actions.handleTitleBlur}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={
              !drag.draggingWorkout &&
              drag.draggingPhaseIndex == null &&
              drag.draggingWeekIndex == null
            }
          >
            <ProgramTemplateDifficultyRow
              difficulty={difficulty}
              onChange={actions.handleDifficultyChange}
            />

            <ProgramTemplateEditorPhaseSection
              visible={phaseCount > 0}
              phases={state.phases}
              selectedPhaseIndex={clampedPhaseIndex}
              draggingPhaseIndex={drag.draggingPhaseIndex}
              phaseDragFromIndexShared={drag.phaseDragFromIndexShared}
              phaseDropTargetIndexShared={drag.phaseDropTargetIndexShared}
              phaseSlotWidth={PHASE_SLOT_W}
              phaseSectionRef={drag.phaseSectionRef}
              phaseScrollMeasureRef={drag.phaseScrollMeasureRef}
              phaseScrollRef={drag.phaseScrollRef}
              phaseCarouselStyle={drag.phaseCarouselStyle}
              compactSectionStyle={styles.compactSection}
              onScrollMeasureLayout={drag.handlePhaseScrollMeasureLayout}
              onScroll={drag.onPhaseScroll}
              onContentSizeChange={(w, _h) => {
                drag.setPhaseScrollContentW(w);
              }}
              onPhaseTabLayout={drag.handlePhaseTabLayout}
              onPressPhase={(i) => setSelectedPhaseIndex(i)}
              onLongPressPhase={drag.handlePhaseLongPress}
              onRemovePhase={actions.handleRemovePhase}
              onAddPhase={actions.handleAddPhase}
              canRemove={phaseCount > 1}
            />

            <ProgramTemplateEditorWeekSection
              visible={phaseCount > 0 && currentPhase != null}
              weeks={currentPhase?.weeks ?? []}
              selectedWeekIndex={clampedWeekIndex}
              draggingWeekIndex={drag.draggingWeekIndex}
              weekDragFromIndexShared={drag.weekDragFromIndexShared}
              weekDropTargetIndexShared={drag.weekDropTargetIndexShared}
              weekSlotWidth={WEEK_SLOT_W}
              weekPillColorByIndex={weekPillColorByIndex}
              weekSectionRef={drag.weekSectionRef}
              weekScrollMeasureRef={drag.weekScrollMeasureRef}
              weekScrollRef={drag.weekScrollRef}
              weekCarouselStyle={drag.weekCarouselStyle}
              compactSectionStyle={styles.compactSection}
              onScrollMeasureLayout={drag.handleWeekScrollMeasureLayout}
              onScroll={drag.onWeekScroll}
              onContentSizeChange={(w, _h) => {
                drag.setWeekScrollContentW(w);
              }}
              onWeekPillLayout={drag.handleWeekPillLayout}
              onPressWeek={(i) => setSelectedWeekIndex(i)}
              onLongPressWeek={drag.handleWeekLongPress}
              onRemoveWeek={actions.handleRemoveWeek}
              onAddWeek={actions.handleAddWeek}
              canRemove={phaseWeeksCount > 1}
              canAdd={phaseWeeksCount < 52}
            />

            {/* Week schedule (Days): neutral design, no week colors */}
            {currentWeek && currentPhase && (
              <ProgramTemplateEditorDaysSection
                phaseTitle={currentPhase.title}
                weekLabel={currentWeek.label}
                days={currentWeek.days}
                dayLabels={DAY_LABELS}
                dragging={drag.draggingWorkout}
                clampedPhaseIndex={clampedPhaseIndex}
                clampedWeekIndex={clampedWeekIndex}
                hoveredDayOrderShared={drag.hoveredDayOrderShared}
                daysSectionRef={drag.daysSectionRef}
                dayRowRefsRef={drag.dayRowRefsRef}
                dayLayoutsRef={drag.dayLayoutsRef}
                onDuplicateWeek={actions.handleDuplicateWeek}
                onOpenDayPlanner={(dayOrder) =>
                  setDayPlannerOpen({
                    phaseIndex: clampedPhaseIndex,
                    weekIndex: clampedWeekIndex,
                    dayOrder,
                  })
                }
                onStartDragWorkoutChip={drag.startDragWorkoutChip}
                getDayWorkoutTitles={actions.getDayWorkoutTitles}
              />
            )}
          </ScrollView>

          <ProgramTemplateCarouselBackdrop
            visible={
              drag.draggingPhaseIndex != null || drag.draggingWeekIndex != null
            }
            backdropStyle={drag.carouselBackdropStyle}
            topStyle={drag.carouselTopRegionStyle}
            bottomStyle={drag.carouselBottomRegionStyle}
            leftStyle={drag.carouselLeftRegionStyle}
            rightStyle={drag.carouselRightRegionStyle}
          />

          <ProgramTemplateDragOverlays
            draggingWorkout={drag.draggingWorkout}
            draggingPhaseTitle={
              drag.draggingPhaseIndex != null
                ? state.phases[drag.draggingPhaseIndex]?.title ?? null
                : null
            }
            draggingWeekLabel={
              drag.draggingWeekIndex != null
                ? currentPhase?.weeks?.[drag.draggingWeekIndex]?.label ?? null
                : null
            }
            workoutOverlayStyle={drag.dragOverlayChipStyle}
            phaseOverlayStyle={drag.phaseOverlayStyle}
            weekOverlayStyle={drag.weekOverlayStyle}
            colors={{
              workoutBg: hexToRgba(theme.colors.accent, 0.25),
              phaseBg: theme.colors.accent,
              weekBg: theme.colors.accent,
              border: theme.colors.border,
              background: theme.colors.background,
              text: theme.colors.text,
            }}
          />

          <ProgramTemplateEditorMenuModal
            visible={menuOpen}
            onClose={() => setMenuOpen(false)}
            onDuplicate={actions.handleDuplicateTemplate}
            onArchive={actions.handleArchiveTemplate}
            onDelete={actions.handleDeleteTemplate}
          />

          <DayPlannerSheet
            visible={dayPlannerOpen !== null}
            weekIndex={dayPlannerOpen?.weekIndex ?? 0}
            dayLabel={
              openDay ? DAY_LABELS[openDay.order] ?? openDay.label : "Day"
            }
            day={openDay ?? null}
            state={state}
            workoutRowsMap={workoutRowsMap}
            onClose={() => setDayPlannerOpen(null)}
            onAddWorkout={() => {
              setChooseWorkoutsOpen(true);
            }}
            onRemoveWorkoutAt={actions.handleRemoveWorkoutFromDayAt}
          />

          <ChooseFromWorkoutsSheet
            visible={chooseWorkoutsOpen}
            onClose={() => setChooseWorkoutsOpen(false)}
            onSelectWorkout={(workoutId) =>
              actions.handleAddWorkoutToDay(workoutId)
            }
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
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 40 },
  compactSection: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 4,
    marginBottom: 3,
    borderBottomWidth: 1,
  },
});
