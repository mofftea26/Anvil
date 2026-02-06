import { RemoveCircleHalfDotIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import {
  createAnimatedComponent,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutsByTrainer } from "@/features/builder/api/workouts.api";
import {
  addPhase,
  addPhaseWeek,
  archiveProgramTemplate,
  deleteProgramTemplate,
  duplicateProgramTemplate,
  duplicateWeek,
  fetchProgramTemplateById,
  moveWorkoutBetweenDays,
  removePhase,
  removePhaseWeek,
  removeWorkoutFromDayAt,
  reorderPhases,
  reorderWeeksInPhase,
  setDayWorkoutFromTable,
  updateProgramTemplate,
} from "@/features/library/api/programTemplates.api";
import { ChooseFromWorkoutsSheet } from "@/features/library/components/program-templates/ChooseFromWorkoutsSheet";
import { DayPlannerSheet } from "@/features/library/components/program-templates/DayPlannerSheet";
import type {
  ProgramDay,
  ProgramDifficulty,
  ProgramPhase,
  ProgramTemplate,
  ProgramTemplateState,
  ProgramWeek,
} from "@/features/library/types/programTemplate";
import { PROGRAM_DIFFICULTIES } from "@/features/library/types/programTemplate";
import {
  DIFFICULTY_ICONS,
  getDifficultyColors,
} from "@/features/library/utils/programColors";
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
const DRAG_LIFT_Y = 10;
const DRAG_SCALE = 1.2;
const CAROUSEL_SECTION_SCALE = 1.06;
const CAROUSEL_HOLE_PAD = 14;

const AnimatedView = createAnimatedComponent(View);
const AnimatedBlurView = createAnimatedComponent(BlurView);

function phaseHasData(phase: ProgramPhase): boolean {
  return phase.weeks.some((w) =>
    w.days.some((d) => (d.workouts?.length ?? 0) > 0 || d.workoutRef != null)
  );
}

function weekHasData(week: ProgramWeek): boolean {
  return week.days.some(
    (d) => (d.workouts?.length ?? 0) > 0 || d.workoutRef != null
  );
}

/** Fingerprint for week content so identical weeks get the same color. */
function weekContentFingerprint(week: ProgramWeek): string {
  return week.days
    .map((d) => {
      const refs = d.workouts ?? (d.workoutRef ? [d.workoutRef] : []);
      return refs
        .map((r) =>
          r?.source === "workoutsTable"
            ? `t:${r.workoutId}`
            : r?.source === "inline"
            ? `i:${r.inlineWorkoutId}`
            : ""
        )
        .join(",");
    })
    .join("|");
}

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

  type DraggingState = {
    fromDayOrder: number;
    workoutIndex: number;
    workoutTitle: string;
  };
  const [dragging, setDraggingState] = useState<DraggingState | null>(null);
  const dayLayoutsRef = useRef<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  const dayRowRefsRef = useRef<Record<number, View | null>>({});
  const daysSectionRef = useRef<View>(null);
  const rootContainerRef = useRef<View>(null);
  const phaseSectionRef = useRef<View>(null);
  const weekSectionRef = useRef<View>(null);
  const rootLayoutRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const dragOverlayX = useSharedValue(0);
  const dragOverlayY = useSharedValue(0);
  const rootLayoutX = useSharedValue(0);
  const rootLayoutY = useSharedValue(0);
  const dragModeShared = useSharedValue(0);
  const dragGrabOffsetX = useSharedValue(0);
  const dragGrabOffsetY = useSharedValue(0);
  const dragFromDayOrder = useSharedValue(0);
  const dragWorkoutIndex = useSharedValue(0);
  const hoveredDayOrderShared = useSharedValue(-1);
  // 0 = none, 1 = phases, 2 = weeks (UI-thread carousel focus)
  const dragFocusSectionShared = useSharedValue(0);
  const focusRectX = useSharedValue(0);
  const focusRectY = useSharedValue(0);
  const focusRectW = useSharedValue(0);
  const focusRectH = useSharedValue(0);
  const phaseDragFromIndexShared = useSharedValue(-1);
  const phaseDropTargetIndexShared = useSharedValue(-1);
  const weekDragFromIndexShared = useSharedValue(-1);
  const weekDropTargetIndexShared = useSharedValue(-1);
  const globalUpdateTick = useSharedValue(0);

  type DraggingPhaseState = number | null;
  const [draggingPhaseIndex, setDraggingPhaseIndex] =
    useState<DraggingPhaseState>(null);
  const phaseLayoutsRef = useRef<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  const phaseTabRefsRef = useRef<Record<number, View | null>>({});

  type DraggingWeekState = number | null;
  const [draggingWeekIndex, setDraggingWeekIndex] =
    useState<DraggingWeekState>(null);
  const weekLayoutsRef = useRef<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  const weekTabRefsRef = useRef<Record<number, View | null>>({});

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

  const weekPillColorByIndex = useMemo(() => {
    const weeks = currentPhase?.weeks ?? [];
    if (weeks.length === 0) return [] as string[];
    const fingerprints = weeks.map((w) => weekContentFingerprint(w));
    const seen = new Map<string, number>();
    const groupIds = fingerprints.map((f) => {
      if (!seen.has(f)) seen.set(f, seen.size);
      return seen.get(f)!;
    });
    const palette = [
      "transparent",
      hexToRgba(theme.colors.accent, 0.14),
      hexToRgba(theme.colors.accent, 0.22),
      hexToRgba(theme.colors.textMuted, 0.12),
      hexToRgba(theme.colors.textMuted, 0.2),
    ];
    return groupIds.map((gid) => palette[(gid % (palette.length - 1)) + 1]);
  }, [currentPhase?.weeks, theme.colors.accent, theme.colors.textMuted]);

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

  const setDragging = useCallback(
    (payload: DraggingState) => {
      setDraggingState(payload);
      dragFromDayOrder.value = payload.fromDayOrder;
      dragWorkoutIndex.value = payload.workoutIndex;
      const layout = rootLayoutRef.current;
      if (layout) {
        rootLayoutX.value = layout.x;
        rootLayoutY.value = layout.y;
      }
      rootContainerRef.current?.measureInWindow((x, y) => {
        rootLayoutRef.current = { x, y };
        rootLayoutX.value = x;
        rootLayoutY.value = y;
      });
    },
    [dragFromDayOrder, dragWorkoutIndex, rootLayoutX, rootLayoutY]
  );
  const handleDrop = useCallback(
    (
      dropX: number,
      dropY: number,
      fromDayOrder: number,
      workoutIndex: number
    ) => {
      const layouts = dayLayoutsRef.current;
      let toDayOrder: number | null = null;
      for (let order = 0; order < 7; order++) {
        const layout = layouts[order];
        if (
          layout &&
          dropY >= layout.y &&
          dropY <= layout.y + layout.height &&
          dropX >= layout.x &&
          dropX <= layout.x + layout.width
        ) {
          toDayOrder = order;
          break;
        }
      }
      if (state && toDayOrder !== null && toDayOrder !== fromDayOrder) {
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
      }
      setDraggingState(null);
    },
    [state, clampedPhaseIndex, clampedWeekIndex, schedulePersist]
  );

  const dragOverlayChipStyle = useAnimatedStyle(() => ({
    left:
      dragOverlayX.value -
      rootLayoutX.value -
      dragGrabOffsetX.value * DRAG_SCALE,
    top:
      dragOverlayY.value -
      rootLayoutY.value -
      dragGrabOffsetY.value * DRAG_SCALE,
    transform: [{ scale: DRAG_SCALE }],
  }));

  const carouselBackdropStyle = useAnimatedStyle(() => {
    const active =
      dragModeShared.value === 1 && dragFocusSectionShared.value !== 0;
    return {
      opacity: withTiming(active ? 1 : 0, {
        duration: active ? 120 : 160,
      }),
    };
  });

  const carouselTopRegionStyle = useAnimatedStyle(() => ({
    left: 0,
    right: 0,
    top: 0,
    height: focusRectY.value,
  }));

  const carouselBottomRegionStyle = useAnimatedStyle(() => ({
    left: 0,
    right: 0,
    top: focusRectY.value + focusRectH.value,
    bottom: 0,
  }));

  const carouselLeftRegionStyle = useAnimatedStyle(() => ({
    left: 0,
    top: focusRectY.value,
    width: focusRectX.value,
    height: focusRectH.value,
  }));

  const carouselRightRegionStyle = useAnimatedStyle(() => ({
    left: focusRectX.value + focusRectW.value,
    right: 0,
    top: focusRectY.value,
    height: focusRectH.value,
  }));

  const phaseCarouselStyle = useAnimatedStyle(() => {
    const active =
      dragModeShared.value === 1 && dragFocusSectionShared.value === 1;
    const scale = withSpring(active ? CAROUSEL_SECTION_SCALE : 1, {
      damping: 18,
      stiffness: 220,
    });
    const lift = withSpring(active ? -2 : 0, { damping: 18, stiffness: 220 });
    return {
      zIndex: active ? 10 : 0,
      elevation: active ? 10 : 0,
      transform: [{ translateY: lift }, { scale }],
    };
  });

  const weekCarouselStyle = useAnimatedStyle(() => {
    const active =
      dragModeShared.value === 1 && dragFocusSectionShared.value === 2;
    const scale = withSpring(active ? CAROUSEL_SECTION_SCALE : 1, {
      damping: 18,
      stiffness: 220,
    });
    const lift = withSpring(active ? -2 : 0, { damping: 18, stiffness: 220 });
    return {
      zIndex: active ? 10 : 0,
      elevation: active ? 10 : 0,
      transform: [{ translateY: lift }, { scale }],
    };
  });

  function DayRowWithScale({
    dayOrder,
    children,
  }: {
    dayOrder: number;
    children: React.ReactNode;
  }) {
    const style = useAnimatedStyle(() => {
      const isHover = hoveredDayOrderShared.value === dayOrder;
      return {
        transform: [
          {
            scale: withSpring(isHover ? 1.025 : 1, {
              damping: 18,
              stiffness: 240,
            }),
          },
        ],
      };
    });
    return <AnimatedView style={style}>{children}</AnimatedView>;
  }

  function PhaseTabWithOffset({
    index,
    children,
  }: {
    index: number;
    children: React.ReactNode;
  }) {
    const style = useAnimatedStyle(() => {
      const from = phaseDragFromIndexShared.value;
      const to = phaseDropTargetIndexShared.value;
      if (from < 0 || to < 0 || from === to)
        return { transform: [{ translateX: 0 }] };
      const SLOT_W = 76;
      let offset = 0;
      if (to < from && index >= to && index < from) offset = SLOT_W;
      if (to > from && index > from && index <= to) offset = -SLOT_W;
      return {
        transform: [
          { translateX: withSpring(offset, { damping: 20, stiffness: 260 }) },
        ],
      };
    });
    return <AnimatedView style={style}>{children}</AnimatedView>;
  }

  function WeekPillWithOffset({
    index,
    children,
  }: {
    index: number;
    children: React.ReactNode;
  }) {
    const style = useAnimatedStyle(() => {
      const from = weekDragFromIndexShared.value;
      const to = weekDropTargetIndexShared.value;
      if (from < 0 || to < 0 || from === to)
        return { transform: [{ translateX: 0 }] };
      const SLOT_W = 56;
      let offset = 0;
      if (to < from && index >= to && index < from) offset = SLOT_W;
      if (to > from && index > from && index <= to) offset = -SLOT_W;
      return {
        transform: [
          { translateX: withSpring(offset, { damping: 20, stiffness: 260 }) },
        ],
      };
    });
    return <AnimatedView style={style}>{children}</AnimatedView>;
  }

  const updateHoveredDay = useCallback(
    (x: number, y: number) => {
      const layouts = dayLayoutsRef.current;
      let order = -1;
      for (let i = 0; i < 7; i++) {
        const L = layouts[i];
        if (
          L &&
          x >= L.x &&
          x <= L.x + L.width &&
          y >= L.y &&
          y <= L.y + L.height
        ) {
          order = i;
          break;
        }
      }
      hoveredDayOrderShared.value = order;
    },
    [hoveredDayOrderShared]
  );

  const updatePhaseDropPreview = useCallback(
    (x: number) => {
      if (!state) return;
      const layouts = phaseLayoutsRef.current;
      const cnt = state.phases.length;
      let to = Math.max(0, cnt - 1);
      for (let i = 0; i < cnt; i++) {
        const L = layouts[i];
        if (!L) continue;
        const mid = L.x + L.width / 2;
        if (x < mid) {
          to = i;
          break;
        }
      }
      phaseDropTargetIndexShared.value = to;
    },
    [state, phaseDropTargetIndexShared]
  );

  const updateWeekDropPreview = useCallback(
    (x: number) => {
      const cnt = currentPhase?.weeks?.length ?? 0;
      if (cnt === 0) return;
      const layouts = weekLayoutsRef.current;
      let to = Math.max(0, cnt - 1);
      for (let i = 0; i < cnt; i++) {
        const L = layouts[i];
        if (!L) continue;
        const mid = L.x + L.width / 2;
        if (x < mid) {
          to = i;
          break;
        }
      }
      weekDropTargetIndexShared.value = to;
    },
    [currentPhase?.weeks?.length, weekDropTargetIndexShared]
  );

  const dropPhaseAt = useCallback(
    (fromIndex: number, x: number, y: number) => {
      if (!state) return;
      const layouts = phaseLayoutsRef.current;
      const phaseCnt = state.phases.length;
      let toIndex = Math.max(0, phaseCnt - 1);
      for (let i = 0; i < phaseCnt; i++) {
        const L = layouts[i];
        if (!L) continue;
        const mid = L.x + L.width / 2;
        if (x < mid) {
          toIndex = i;
          break;
        }
      }
      if (toIndex !== fromIndex) {
        const next = reorderPhases(state, fromIndex, toIndex);
        setState(next);
        schedulePersist({ state: next });
        setSelectedPhaseIndex(toIndex);
      }
    },
    [state, schedulePersist]
  );

  const dropWeekAt = useCallback(
    (fromIndex: number, x: number, y: number) => {
      if (!state) return;
      const layouts = weekLayoutsRef.current;
      const weekCnt = currentPhase?.weeks?.length ?? 0;
      let toIndex = Math.max(0, weekCnt - 1);
      for (let i = 0; i < weekCnt; i++) {
        const L = layouts[i];
        if (!L) continue;
        const mid = L.x + L.width / 2;
        if (x < mid) {
          toIndex = i;
          break;
        }
      }
      if (toIndex !== fromIndex) {
        const next = reorderWeeksInPhase(
          state,
          clampedPhaseIndex,
          fromIndex,
          toIndex
        );
        setState(next);
        schedulePersist({ state: next });
        setSelectedWeekIndex(toIndex);
      }
    },
    [state, clampedPhaseIndex, currentPhase?.weeks?.length, schedulePersist]
  );

  const handleGlobalDrop = useCallback(
    (x: number, y: number) => {
      if (!state) return;
      if (dragging) {
        handleDrop(x, y, dragging.fromDayOrder, dragging.workoutIndex);
        return;
      }
      if (draggingPhaseIndex != null) {
        dropPhaseAt(draggingPhaseIndex, x, y);
        return;
      }
      if (draggingWeekIndex != null) {
        dropWeekAt(draggingWeekIndex, x, y);
      }
    },
    [
      state,
      dragging,
      draggingPhaseIndex,
      draggingWeekIndex,
      handleDrop,
      dropPhaseAt,
      dropWeekAt,
    ]
  );

  const globalPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesMove((_e, stateManager) => {
          if (dragModeShared.value === 1) stateManager.activate();
        })
        .onUpdate((e) => {
          if (dragModeShared.value !== 1) return;
          dragOverlayX.value = e.absoluteX;
          dragOverlayY.value = e.absoluteY;
          globalUpdateTick.value += 1;
          if (globalUpdateTick.value % 4 !== 0) return;
          if (dragging) {
            runOnJS(updateHoveredDay)(e.absoluteX, e.absoluteY);
          } else if (draggingPhaseIndex != null) {
            runOnJS(updatePhaseDropPreview)(e.absoluteX);
          } else if (draggingWeekIndex != null) {
            runOnJS(updateWeekDropPreview)(e.absoluteX);
          }
        })
        .onEnd((e) => {
          if (dragModeShared.value !== 1) return;
          runOnJS(handleGlobalDrop)(e.absoluteX, e.absoluteY);
        })
        .onFinalize(() => {
          dragModeShared.value = 0;
          dragFocusSectionShared.value = 0;
          focusRectX.value = 0;
          focusRectY.value = 0;
          focusRectW.value = 0;
          focusRectH.value = 0;
          hoveredDayOrderShared.value = -1;
          phaseDragFromIndexShared.value = -1;
          phaseDropTargetIndexShared.value = -1;
          weekDragFromIndexShared.value = -1;
          weekDropTargetIndexShared.value = -1;
          runOnJS(setDraggingState)(null);
          runOnJS(setDraggingPhaseIndex)(null);
          runOnJS(setDraggingWeekIndex)(null);
        }),
    [
      dragModeShared,
      dragFocusSectionShared,
      focusRectX,
      focusRectY,
      focusRectW,
      focusRectH,
      dragOverlayX,
      dragOverlayY,
      handleGlobalDrop,
      globalUpdateTick,
      dragging,
      draggingPhaseIndex,
      draggingWeekIndex,
      updateHoveredDay,
      updatePhaseDropPreview,
      updateWeekDropPreview,
      hoveredDayOrderShared,
      phaseDragFromIndexShared,
      phaseDropTargetIndexShared,
      weekDragFromIndexShared,
      weekDropTargetIndexShared,
    ]
  );

  useEffect(() => {
    if (!dragging && draggingPhaseIndex == null && draggingWeekIndex == null)
      return;
    rootContainerRef.current?.measureInWindow((x, y) => {
      rootLayoutRef.current = { x, y };
      rootLayoutX.value = x;
      rootLayoutY.value = y;
    });
  }, [
    dragging,
    draggingPhaseIndex,
    draggingWeekIndex,
    rootLayoutX,
    rootLayoutY,
  ]);

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
    if (!state || !currentPhase) return;
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
      alert.confirm({
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
  };

  const handleDuplicateWeek = () => {
    if (!state) return;
    const next = duplicateWeek(state, clampedPhaseIndex, clampedWeekIndex);
    setState(next);
    schedulePersist({ state: next });
    setSelectedWeekIndex(clampedWeekIndex + 1);
  };

  const phaseOverlayStyle = useAnimatedStyle(() => ({
    left:
      dragOverlayX.value -
      rootLayoutX.value -
      dragGrabOffsetX.value * DRAG_SCALE,
    top:
      dragOverlayY.value -
      rootLayoutY.value -
      dragGrabOffsetY.value * DRAG_SCALE,
    transform: [{ scale: DRAG_SCALE }],
  }));

  const weekOverlayStyle = useAnimatedStyle(() => ({
    left:
      dragOverlayX.value -
      rootLayoutX.value -
      dragGrabOffsetX.value * DRAG_SCALE,
    top:
      dragOverlayY.value -
      rootLayoutY.value -
      dragGrabOffsetY.value * DRAG_SCALE,
    transform: [{ scale: DRAG_SCALE }],
  }));

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
    if (!state || phaseCount <= 1 || !currentPhase) return;

    const doRemove = () => {
      const next = removePhase(state, clampedPhaseIndex);
      setState(next);
      schedulePersist({ state: next });
      setSelectedPhaseIndex(
        Math.min(clampedPhaseIndex, next.phases.length - 1)
      );
    };

    if (phaseHasData(currentPhase)) {
      alert.confirm({
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
    <GestureHandlerRootView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <GestureDetector gesture={globalPanGesture}>
        <View
          ref={rootContainerRef}
          style={styles.screen}
          collapsable={false}
          onLayout={() => {
            rootContainerRef.current?.measureInWindow((x, y) => {
              rootLayoutRef.current = { x, y };
            });
          }}
        >
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
            scrollEnabled={
              !dragging &&
              draggingPhaseIndex == null &&
              draggingWeekIndex == null
            }
          >
            {/* Difficulty: app-wide colors + signal icons */}
            <View style={styles.difficultyRow}>
              {PROGRAM_DIFFICULTIES.map((d) => {
                const diffColors = getDifficultyColors(d);
                const isActive = difficulty === d;
                return (
                  <View key={d} style={styles.difficultyChipWrap}>
                    <Chip
                      label={t(DIFFICULTY_KEYS[d])}
                      isActive={isActive}
                      onPress={() => handleDifficultyChange(d)}
                      style={styles.difficultyChipFlex}
                      activeBackgroundColor={diffColors.main}
                      activeBorderColor={diffColors.border}
                      activeLabelColor={diffColors.textOnMain}
                      left={
                        <Icon
                          name={DIFFICULTY_ICONS[d]}
                          size={16}
                          color={
                            isActive ? diffColors.textOnMain : diffColors.main
                          }
                          strokeWidth={1.5}
                        />
                      }
                    />
                  </View>
                );
              })}
            </View>

            {/* Phase: vertical, keep as-is */}
            {phaseCount > 0 && (
              <AnimatedView
                ref={phaseSectionRef}
                collapsable={false}
                style={[
                  styles.compactSection,
                  { borderBottomColor: theme.colors.border },
                  phaseCarouselStyle,
                ]}
              >
                <View style={styles.compactLabelRow}>
                  <Icon
                    name="cells"
                    size={16}
                    color={theme.colors.textMuted}
                    strokeWidth={1.5}
                  />
                  <Text
                    weight="semibold"
                    style={[
                      styles.compactLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {t("library.programsScreen.phase", "Phase")}
                  </Text>
                </View>
                <View style={styles.tabRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.phaseScrollView}
                    contentContainerStyle={styles.phaseScroll}
                    scrollEnabled={draggingPhaseIndex == null}
                  >
                    {state.phases.map((phase, i) => {
                      const isSelected = clampedPhaseIndex === i;
                      return (
                        <PhaseTabWithOffset key={`phase-${i}`} index={i}>
                          <Pressable
                            ref={(r) => {
                              phaseTabRefsRef.current[i] = r as View | null;
                            }}
                            onLayout={() => {
                              const ref = phaseTabRefsRef.current[i];
                              if (
                                ref &&
                                typeof (ref as any).measureInWindow ===
                                  "function"
                              ) {
                                (ref as any).measureInWindow(
                                  (
                                    x: number,
                                    y: number,
                                    w: number,
                                    h: number
                                  ) => {
                                    phaseLayoutsRef.current[i] = {
                                      x,
                                      y,
                                      width: w,
                                      height: h,
                                    };
                                  }
                                );
                              }
                            }}
                            delayLongPress={500}
                            onLongPress={(e) => {
                              const ne = e.nativeEvent as any;
                              const pageX = ne?.pageX ?? 0;
                              const pageY = ne?.pageY ?? 0;
                              const lx = ne?.locationX ?? 0;
                              const ly = ne?.locationY ?? 0;
                              dragStartX.value = pageX;
                              dragStartY.value = pageY;
                              dragOverlayX.value = pageX;
                              dragOverlayY.value = pageY;
                              dragGrabOffsetX.value = lx;
                              // Keep the chip on the finger (avoid downward jump)
                              dragGrabOffsetY.value = ly + DRAG_LIFT_Y;
                              dragModeShared.value = 1;
                              dragFocusSectionShared.value = 1;
                              phaseDragFromIndexShared.value = i;
                              phaseDropTargetIndexShared.value = i;
                              rootContainerRef.current?.measureInWindow(
                                (rootX, rootY) => {
                                  rootLayoutRef.current = {
                                    x: rootX,
                                    y: rootY,
                                  };
                                  rootLayoutX.value = rootX;
                                  rootLayoutY.value = rootY;
                                  phaseSectionRef.current?.measureInWindow(
                                    (sx, sy, sw, sh) => {
                                      const pad = CAROUSEL_HOLE_PAD;
                                      focusRectX.value = Math.max(
                                        0,
                                        sx - rootX - pad
                                      );
                                      focusRectY.value = Math.max(
                                        0,
                                        sy - rootY - pad
                                      );
                                      focusRectW.value = sw + pad * 2;
                                      focusRectH.value = sh + pad * 2;
                                    }
                                  );
                                }
                              );
                              setDraggingPhaseIndex(i);
                            }}
                            onPress={() => setSelectedPhaseIndex(i)}
                            style={({ pressed }) => [
                              styles.compactTab,
                              {
                                backgroundColor: isSelected
                                  ? theme.colors.accent
                                  : hexToRgba(theme.colors.text, 0.06),
                                opacity:
                                  draggingPhaseIndex === i
                                    ? 0
                                    : pressed
                                    ? 0.9
                                    : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.compactTabText,
                                {
                                  color: isSelected
                                    ? theme.colors.background
                                    : theme.colors.text,
                                },
                              ]}
                            >
                              {phase.title}
                            </Text>
                          </Pressable>
                        </PhaseTabWithOffset>
                      );
                    })}
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
                        size={14}
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
                        size={14}
                        color={theme.colors.accent}
                      />
                    </Pressable>
                  </View>
                </View>
              </AnimatedView>
            )}

            {/* Weeks: vertical, colored pills */}
            {phaseCount > 0 && (
              <AnimatedView
                ref={weekSectionRef}
                collapsable={false}
                style={[
                  styles.compactSection,
                  { borderBottomColor: theme.colors.border },
                  weekCarouselStyle,
                ]}
              >
                <View style={styles.compactLabelRow}>
                  <Icon
                    name="calendar-03"
                    size={16}
                    color={theme.colors.textMuted}
                    strokeWidth={1.5}
                  />
                  <Text
                    weight="semibold"
                    style={[
                      styles.compactLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {t("library.programsScreen.weeksSection", "Weeks")}
                  </Text>
                </View>
                <View style={styles.tabRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.phaseScrollView}
                    contentContainerStyle={styles.phaseScroll}
                    scrollEnabled={draggingWeekIndex == null}
                  >
                    {currentPhase?.weeks.map((w, i) => {
                      const isSelected = clampedWeekIndex === i;
                      return (
                        <WeekPillWithOffset key={w.index} index={i}>
                          <Pressable
                            ref={(r) => {
                              weekTabRefsRef.current[i] = r as View | null;
                            }}
                            onLayout={() => {
                              const ref = weekTabRefsRef.current[i];
                              if (
                                ref &&
                                typeof (ref as any).measureInWindow ===
                                  "function"
                              ) {
                                (ref as any).measureInWindow(
                                  (
                                    x: number,
                                    y: number,
                                    w2: number,
                                    h: number
                                  ) => {
                                    weekLayoutsRef.current[i] = {
                                      x,
                                      y,
                                      width: w2,
                                      height: h,
                                    };
                                  }
                                );
                              }
                            }}
                            delayLongPress={500}
                            onLongPress={(e) => {
                              const ne = e.nativeEvent as any;
                              const pageX = ne?.pageX ?? 0;
                              const pageY = ne?.pageY ?? 0;
                              const lx = ne?.locationX ?? 0;
                              const ly = ne?.locationY ?? 0;
                              dragStartX.value = pageX;
                              dragStartY.value = pageY;
                              dragOverlayX.value = pageX;
                              dragOverlayY.value = pageY;
                              dragGrabOffsetX.value = lx;
                              dragGrabOffsetY.value = ly + DRAG_LIFT_Y;
                              dragModeShared.value = 1;
                              dragFocusSectionShared.value = 2;
                              weekDragFromIndexShared.value = i;
                              weekDropTargetIndexShared.value = i;
                              rootContainerRef.current?.measureInWindow(
                                (rootX, rootY) => {
                                  rootLayoutRef.current = {
                                    x: rootX,
                                    y: rootY,
                                  };
                                  rootLayoutX.value = rootX;
                                  rootLayoutY.value = rootY;
                                  weekSectionRef.current?.measureInWindow(
                                    (sx, sy, sw, sh) => {
                                      const pad = CAROUSEL_HOLE_PAD;
                                      focusRectX.value = Math.max(
                                        0,
                                        sx - rootX - pad
                                      );
                                      focusRectY.value = Math.max(
                                        0,
                                        sy - rootY - pad
                                      );
                                      focusRectW.value = sw + pad * 2;
                                      focusRectH.value = sh + pad * 2;
                                    }
                                  );
                                }
                              );
                              setDraggingWeekIndex(i);
                            }}
                            onPress={() => setSelectedWeekIndex(i)}
                            style={({ pressed }) => [
                              styles.weekPill,
                              {
                                backgroundColor: isSelected
                                  ? theme.colors.accent
                                  : weekPillColorByIndex[i] ?? "transparent",
                                borderColor: theme.colors.border,
                                opacity:
                                  draggingWeekIndex === i
                                    ? 0
                                    : pressed
                                    ? 0.9
                                    : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.compactTabText,
                                {
                                  color: isSelected
                                    ? theme.colors.background
                                    : theme.colors.text,
                                },
                              ]}
                            >
                              {w.label}
                            </Text>
                          </Pressable>
                        </WeekPillWithOffset>
                      );
                    })}
                  </ScrollView>
                  <View style={styles.phaseControlsVertical}>
                    <Pressable
                      onPress={handleRemoveWeek}
                      disabled={phaseWeeksCount <= 1}
                      style={({ pressed }) => [
                        styles.iconBtnTiny,
                        {
                          opacity:
                            phaseWeeksCount <= 1 ? 0.5 : pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <HugeiconsIcon
                        icon={RemoveCircleHalfDotIcon}
                        size={14}
                        color={theme.colors.text}
                      />
                    </Pressable>
                    <Pressable
                      onPress={handleAddWeek}
                      disabled={phaseWeeksCount >= 52}
                      style={({ pressed }) => [
                        styles.iconBtnTiny,
                        {
                          opacity:
                            phaseWeeksCount >= 52 ? 0.5 : pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Icon
                        name="add-circle-outline"
                        size={14}
                        color={theme.colors.accent}
                      />
                    </Pressable>
                  </View>
                </View>
              </AnimatedView>
            )}

            {/* Week schedule (Days): neutral design, no week colors */}
            {currentWeek && (
              <View style={styles.section}>
                <View style={styles.daysSectionTitleRow}>
                  <Text
                    weight="semibold"
                    style={[
                      styles.sectionLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {currentPhase?.title} · {currentWeek.label}
                  </Text>
                  <Pressable
                    onPress={handleDuplicateWeek}
                    style={({ pressed }) => [
                      styles.daysSectionCopyBtn,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Icon
                      name="copy-outline"
                      size={18}
                      color={theme.colors.accent}
                    />
                  </Pressable>
                </View>
                <View ref={daysSectionRef} style={styles.daysList}>
                  {currentWeek.days.map((day) => {
                    const titles = getDayWorkoutTitles(day);
                    const dayLabel = DAY_LABELS[day.order] ?? day.label;
                    const hasWorkouts = titles.length > 0;
                    return (
                      <DayRowWithScale key={day.id} dayOrder={day.order}>
                        <Pressable
                          ref={(r) => {
                            dayRowRefsRef.current[day.order] = r as View | null;
                          }}
                          onLayout={() => {
                            const rowRef = dayRowRefsRef.current[day.order];
                            if (
                              rowRef &&
                              typeof (rowRef as any).measureInWindow ===
                                "function"
                            ) {
                              (rowRef as any).measureInWindow(
                                (
                                  x: number,
                                  y: number,
                                  w: number,
                                  h: number
                                ) => {
                                  dayLayoutsRef.current[day.order] = {
                                    x,
                                    y,
                                    width: w,
                                    height: h,
                                  };
                                }
                              );
                            }
                          }}
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
                                theme.colors.surface3 ??
                                theme.colors.background,
                              borderColor: theme.colors.border,
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
                              titles.map((workoutTitle, idx) => {
                                const isThisChipDragging =
                                  dragging &&
                                  dragging.fromDayOrder === day.order &&
                                  dragging.workoutIndex === idx;
                                if (isThisChipDragging) {
                                  return (
                                    <View
                                      key={idx}
                                      style={[
                                        styles.workoutChip,
                                        {
                                          backgroundColor: hexToRgba(
                                            theme.colors.accent,
                                            0.15
                                          ),
                                          opacity: 0,
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
                                  );
                                }
                                return (
                                  <Pressable
                                    key={idx}
                                    delayLongPress={500}
                                    onLongPress={(e) => {
                                      const ne = e.nativeEvent as any;
                                      const pageX = ne?.pageX ?? 0;
                                      const pageY = ne?.pageY ?? 0;
                                      const lx = ne?.locationX ?? 0;
                                      const ly = ne?.locationY ?? 0;
                                      dragStartX.value = pageX;
                                      dragStartY.value = pageY;
                                      dragOverlayX.value = pageX;
                                      dragOverlayY.value = pageY;
                                      dragGrabOffsetX.value = lx;
                                      dragGrabOffsetY.value = ly + DRAG_LIFT_Y;
                                      dragModeShared.value = 1;
                                      dragFocusSectionShared.value = 0;
                                      rootContainerRef.current?.measureInWindow(
                                        (x, y) => {
                                          rootLayoutRef.current = { x, y };
                                          rootLayoutX.value = x;
                                          rootLayoutY.value = y;
                                        }
                                      );
                                      setDragging({
                                        fromDayOrder: day.order,
                                        workoutIndex: idx,
                                        workoutTitle: workoutTitle,
                                      });
                                    }}
                                    onPress={() =>
                                      setDayPlannerOpen({
                                        phaseIndex: clampedPhaseIndex,
                                        weekIndex: clampedWeekIndex,
                                        dayOrder: day.order,
                                      })
                                    }
                                  >
                                    <View
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
                                  </Pressable>
                                );
                              })
                            )}
                          </View>
                        </Pressable>
                      </DayRowWithScale>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Carousel focus backdrop for phase/week dragging (pointerEvents none so dragging stays responsive) */}
          {(draggingPhaseIndex != null || draggingWeekIndex != null) && (
            <AnimatedView
              pointerEvents="none"
              style={[styles.carouselBackdrop, carouselBackdropStyle]}
            >
              <AnimatedView
                style={[styles.carouselRegion, carouselTopRegionStyle]}
              >
                <AnimatedBlurView
                  intensity={18}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: "rgba(0,0,0,0.12)" },
                  ]}
                />
              </AnimatedView>
              <AnimatedView
                style={[styles.carouselRegion, carouselBottomRegionStyle]}
              >
                <AnimatedBlurView
                  intensity={18}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: "rgba(0,0,0,0.12)" },
                  ]}
                />
              </AnimatedView>
              <AnimatedView
                style={[styles.carouselRegion, carouselLeftRegionStyle]}
              >
                <AnimatedBlurView
                  intensity={18}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: "rgba(0,0,0,0.12)" },
                  ]}
                />
              </AnimatedView>
              <AnimatedView
                style={[styles.carouselRegion, carouselRightRegionStyle]}
              >
                <AnimatedBlurView
                  intensity={18}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: "rgba(0,0,0,0.12)" },
                  ]}
                />
              </AnimatedView>
            </AnimatedView>
          )}

          {/* Drag overlay: chip clone driven by UI thread (no re-renders while dragging) */}
          {dragging && (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <AnimatedView
                style={[
                  styles.dragChipClone,
                  {
                    backgroundColor: hexToRgba(theme.colors.accent, 0.25),
                  },
                  dragOverlayChipStyle,
                ]}
              >
                <Text
                  style={[styles.workoutChipText, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {dragging.workoutTitle}
                </Text>
              </AnimatedView>
            </View>
          )}

          {/* Phase drag overlay */}
          {draggingPhaseIndex != null &&
            state?.phases?.[draggingPhaseIndex] && (
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <AnimatedView
                  style={[
                    styles.phaseDragOverlay,
                    {
                      backgroundColor: theme.colors.accent,
                    },
                    phaseOverlayStyle,
                  ]}
                >
                  <Text
                    style={[
                      styles.compactTabText,
                      { color: theme.colors.background },
                    ]}
                    numberOfLines={1}
                  >
                    {state.phases[draggingPhaseIndex].title}
                  </Text>
                </AnimatedView>
              </View>
            )}

          {/* Week drag overlay */}
          {draggingWeekIndex != null &&
            currentPhase?.weeks?.[draggingWeekIndex] && (
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                <AnimatedView
                  style={[
                    styles.weekDragOverlay,
                    {
                      backgroundColor: theme.colors.accent,
                      borderColor: theme.colors.border,
                    },
                    weekOverlayStyle,
                  ]}
                >
                  <Text
                    style={[
                      styles.compactTabText,
                      { color: theme.colors.background },
                    ]}
                    numberOfLines={1}
                  >
                    {currentPhase.weeks[draggingWeekIndex].label}
                  </Text>
                </AnimatedView>
              </View>
            )}

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
            dayLabel={
              openDay ? DAY_LABELS[openDay.order] ?? openDay.label : "Day"
            }
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
      </GestureDetector>
    </GestureHandlerRootView>
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
    marginBottom: 3,
    borderBottomWidth: 1,
  },
  compactLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  compactLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 0,
    marginTop: 0,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 0,
  },
  compactTab: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  weekPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  compactTabText: { fontSize: 11, fontWeight: "600" },
  phaseControlsVertical: {
    flexDirection: "column",
    gap: 1,
  },
  phaseScroll: { flexDirection: "row", gap: 4, paddingRight: 4 },
  phaseScrollView: { flex: 1, minWidth: 0 },
  section: {
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 8,
    marginBottom: 8,
    gap: 8,
  },
  daysSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  daysSectionCopyBtn: {
    padding: 8,
    marginRight: -8,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 0,
    marginTop: 0,
  },
  iconBtnTiny: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  daysList: { gap: 6, marginTop: 0 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
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
  dragChipClone: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  phaseDragOverlay: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  weekDragOverlay: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  carouselBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  carouselRegion: {
    position: "absolute",
    overflow: "hidden",
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
