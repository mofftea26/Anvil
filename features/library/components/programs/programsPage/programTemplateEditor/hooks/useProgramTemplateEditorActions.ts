import { router } from "expo-router";
import { useCallback } from "react";

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutsByTrainer } from "@/features/builder/api/workouts.api";
import {
  addPhase,
  addPhaseWeek,
  archiveProgramTemplate,
  deleteProgramTemplate,
  duplicateProgramTemplate,
  duplicateWeek,
  moveWorkoutBetweenDays,
  removePhase,
  removePhaseWeek,
  removeWorkoutFromDayAt,
  reorderPhases,
  reorderWeeksInPhase,
  setDayWorkoutFromTable,
} from "@/features/library/api/programTemplates.api";
import type {
  ProgramDay,
  ProgramDifficulty,
  ProgramPhase,
  ProgramTemplateState,
  ProgramWeek,
} from "@/features/library/types/programTemplate";
import { appToast } from "@/shared/ui";

import { phaseHasData, weekHasData } from "../utils";

export function useProgramTemplateEditorActions(params: {
  programId: string;
  trainerId: string;
  title: string;
  difficulty: ProgramDifficulty;
  setDifficulty: (d: ProgramDifficulty) => void;
  state: ProgramTemplateState;
  setState: (s: ProgramTemplateState) => void;
  schedulePersist: (
    patch: Partial<{
      title: string;
      difficulty: ProgramDifficulty;
      state: ProgramTemplateState;
    }>
  ) => void;
  workoutRowsMap: Record<string, WorkoutRow>;
  setWorkoutRowsMap: React.Dispatch<
    React.SetStateAction<Record<string, WorkoutRow>>
  >;
  clampedPhaseIndex: number;
  clampedWeekIndex: number;
  phaseCount: number;
  currentPhase: ProgramPhase | null;
  currentWeek: ProgramWeek | null;
  setSelectedPhaseIndex: (i: number) => void;
  setSelectedWeekIndex: (i: number) => void;
  dayPlannerOpen: {
    phaseIndex: number;
    weekIndex: number;
    dayOrder: number;
  } | null;
  setChooseWorkoutsOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  confirm: (opts: {
    title: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void;
  }) => void;
  t: (key: string, fallback?: string, vars?: Record<string, any>) => string;
}) {
  const {
    programId,
    trainerId,
    title,
    setDifficulty,
    state,
    setState,
    schedulePersist,
    workoutRowsMap,
    setWorkoutRowsMap,
    clampedPhaseIndex,
    clampedWeekIndex,
    phaseCount,
    currentPhase,
    currentWeek,
    setSelectedPhaseIndex,
    setSelectedWeekIndex,
    dayPlannerOpen,
    setChooseWorkoutsOpen,
    setMenuOpen,
    confirm,
    t,
  } = params;

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
    [state?.workoutLibrary?.inlineWorkouts, workoutRowsMap]
  );

  const handleTitleBlur = useCallback(() => {
    if (title.trim().length >= 2) schedulePersist({ title: title.trim() });
  }, [schedulePersist, title]);

  const handleDifficultyChange = useCallback(
    (d: ProgramDifficulty) => {
      setDifficulty(d);
      schedulePersist({ difficulty: d });
    },
    [schedulePersist, setDifficulty]
  );

  const handleAddPhase = useCallback(() => {
    const next = addPhase(state);
    setState(next);
    schedulePersist({ state: next });
    setSelectedPhaseIndex(next.phases.length - 1);
    setSelectedWeekIndex(0);
  }, [
    schedulePersist,
    setSelectedPhaseIndex,
    setSelectedWeekIndex,
    setState,
    state,
  ]);

  const handleRemovePhase = useCallback(() => {
    if (phaseCount <= 1 || !currentPhase) return;

    const doRemove = () => {
      const next = removePhase(state, clampedPhaseIndex);
      setState(next);
      schedulePersist({ state: next });
      setSelectedPhaseIndex(
        Math.min(clampedPhaseIndex, next.phases.length - 1)
      );
    };

    if (phaseHasData(currentPhase)) {
      confirm({
        title: t(
          "library.programsScreen.removePhaseConfirm",
          "Remove this phase? It contains workouts."
        ),
        confirmText: t("library.programsScreen.remove", "Remove"),
        cancelText: t("common.cancel", "Cancel"),
        destructive: true,
        onConfirm: doRemove,
      });
    } else {
      doRemove();
    }
  }, [
    clampedPhaseIndex,
    confirm,
    currentPhase,
    phaseCount,
    schedulePersist,
    setSelectedPhaseIndex,
    setState,
    state,
    t,
  ]);

  const handleAddWeek = useCallback(() => {
    const next = addPhaseWeek(state, clampedPhaseIndex);
    setState(next);
    schedulePersist({ state: next });
    const newLen = next.phases[clampedPhaseIndex]?.weeks.length ?? 0;
    setSelectedWeekIndex(Math.max(0, newLen - 1));
  }, [
    clampedPhaseIndex,
    schedulePersist,
    setSelectedWeekIndex,
    setState,
    state,
  ]);

  const handleRemoveWeek = useCallback(() => {
    if (!currentPhase) return;
    const weekToRemove = currentPhase.weeks[clampedWeekIndex];
    if (!weekToRemove) return;

    const doRemove = () => {
      const next = removePhaseWeek(state, clampedPhaseIndex, clampedWeekIndex);
      setState(next);
      schedulePersist({ state: next });
      const newLen = next.phases[clampedPhaseIndex]?.weeks.length ?? 0;
      setSelectedWeekIndex(Math.min(clampedWeekIndex, Math.max(0, newLen - 1)));
    };

    if (weekHasData(weekToRemove)) {
      confirm({
        title: t(
          "library.programsScreen.removeWeekConfirm",
          "Remove this week? It contains workouts."
        ),
        confirmText: t("library.programsScreen.remove", "Remove"),
        cancelText: t("common.cancel", "Cancel"),
        destructive: true,
        onConfirm: doRemove,
      });
    } else {
      doRemove();
    }
  }, [
    clampedPhaseIndex,
    clampedWeekIndex,
    confirm,
    currentPhase,
    schedulePersist,
    setSelectedWeekIndex,
    setState,
    state,
    t,
  ]);

  const handleDuplicateWeek = useCallback(() => {
    const next = duplicateWeek(state, clampedPhaseIndex, clampedWeekIndex);
    setState(next);
    schedulePersist({ state: next });
    setSelectedWeekIndex(clampedWeekIndex + 1);
  }, [
    clampedPhaseIndex,
    clampedWeekIndex,
    schedulePersist,
    setSelectedWeekIndex,
    setState,
    state,
  ]);

  const handleAddWorkoutToDay = useCallback(
    (workoutId: string) => {
      if (!dayPlannerOpen) return;
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
      fetchWorkoutsByTrainer(trainerId).then((list) => {
        const row = list.find((w) => w.id === workoutId);
        if (row) setWorkoutRowsMap((prev) => ({ ...prev, [workoutId]: row }));
      });
    },
    [
      dayPlannerOpen,
      schedulePersist,
      setChooseWorkoutsOpen,
      setState,
      setWorkoutRowsMap,
      state,
      trainerId,
    ]
  );

  const handleRemoveWorkoutFromDayAt = useCallback(
    (workoutIndex: number) => {
      if (!dayPlannerOpen) return;
      const next = removeWorkoutFromDayAt(
        state,
        dayPlannerOpen.phaseIndex,
        dayPlannerOpen.weekIndex,
        dayPlannerOpen.dayOrder,
        workoutIndex
      );
      setState(next);
      schedulePersist({ state: next });
    },
    [dayPlannerOpen, schedulePersist, setState, state]
  );

  const moveWorkoutToDay = useCallback(
    (fromDayOrder: number, workoutIndex: number, toDayOrder: number) => {
      if (toDayOrder === fromDayOrder) return;
      const next = moveWorkoutBetweenDays(
        state,
        clampedPhaseIndex,
        clampedWeekIndex,
        fromDayOrder,
        workoutIndex,
        toDayOrder
      );
      setState(next);
      schedulePersist({ state: next });
    },
    [clampedPhaseIndex, clampedWeekIndex, schedulePersist, setState, state]
  );

  const commitPhaseDrop = useCallback(
    (fromIndex: number, toIndex: number) => {
      const phaseCnt = state.phases.length;
      const clampedTo = Math.min(
        Math.max(0, toIndex),
        Math.max(0, phaseCnt - 1)
      );
      if (fromIndex === clampedTo) return;
      const next = reorderPhases(state, fromIndex, clampedTo);
      setState(next);
      schedulePersist({ state: next });
      setSelectedPhaseIndex(clampedTo);
    },
    [schedulePersist, setSelectedPhaseIndex, setState, state]
  );

  const commitWeekDrop = useCallback(
    (fromIndex: number, toIndex: number) => {
      const weekCnt = currentPhase?.weeks?.length ?? 0;
      const clampedTo = Math.min(
        Math.max(0, toIndex),
        Math.max(0, weekCnt - 1)
      );
      if (fromIndex === clampedTo) return;
      const next = reorderWeeksInPhase(
        state,
        clampedPhaseIndex,
        fromIndex,
        clampedTo
      );
      setState(next);
      schedulePersist({ state: next });
      setSelectedWeekIndex(clampedTo);
    },
    [
      clampedPhaseIndex,
      currentPhase?.weeks?.length,
      schedulePersist,
      setSelectedWeekIndex,
      setState,
      state,
    ]
  );

  const handleDuplicateTemplate = useCallback(async () => {
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
  }, [programId, setMenuOpen, t]);

  const handleArchiveTemplate = useCallback(() => {
    setMenuOpen(false);
    confirm({
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
  }, [confirm, programId, setMenuOpen, t]);

  const handleDeleteTemplate = useCallback(() => {
    setMenuOpen(false);
    confirm({
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
  }, [confirm, programId, setMenuOpen, t]);

  return {
    getDayWorkoutTitles,
    handleTitleBlur,
    handleDifficultyChange,
    handleAddPhase,
    handleRemovePhase,
    handleAddWeek,
    handleRemoveWeek,
    handleDuplicateWeek,
    handleAddWorkoutToDay,
    handleRemoveWorkoutFromDayAt,
    moveWorkoutToDay,
    commitPhaseDrop,
    commitWeekDrop,
    handleDuplicateTemplate,
    handleArchiveTemplate,
    handleDeleteTemplate,
  };
}
