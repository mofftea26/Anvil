import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, ScrollView } from "react-native-gesture-handler";
import {
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  AUTO_SCROLL_EDGE_PX,
  AUTO_SCROLL_MAX_STEP_PX,
  CAROUSEL_HOLE_PAD,
  CAROUSEL_SECTION_SCALE,
  DRAG_LIFT_Y,
  DRAG_SCALE,
  PHASE_SLOT_W,
  WEEK_SLOT_W,
} from "../constants";
import type { DraggingWorkoutState } from "../types";

export function useProgramTemplateEditorDrag(params: {
  onMoveWorkoutToDay: (
    fromDayOrder: number,
    workoutIndex: number,
    toDayOrder: number
  ) => void;
  onCommitPhaseDrop: (fromIndex: number, toIndex: number) => void;
  onCommitWeekDrop: (fromIndex: number, toIndex: number) => void;
  phaseCount: number;
  weekCount: number;
}) {
  const { onMoveWorkoutToDay, onCommitPhaseDrop, onCommitWeekDrop } = params;

  const [draggingWorkout, setDraggingWorkout] =
    useState<DraggingWorkoutState | null>(null);
  const [draggingPhaseIndex, setDraggingPhaseIndex] = useState<number | null>(
    null
  );
  const [draggingWeekIndex, setDraggingWeekIndex] = useState<number | null>(
    null
  );

  const dayLayoutsRef = useRef<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});
  const dayRowRefsRef = useRef<Record<number, View | null>>({});
  const daysSectionRef = useRef<View>(null);

  const rootContainerRef = useRef<View>(null);
  const phaseSectionRef = useRef<View>(null);
  const weekSectionRef = useRef<View>(null);
  const rootLayoutRef = useRef<{ x: number; y: number } | null>(null);
  const phaseScrollMeasureRef = useRef<View>(null);
  const weekScrollMeasureRef = useRef<View>(null);

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
  // 0 workouts, 1 phases, 2 weeks
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

  const phaseScrollRef = useAnimatedRef<ScrollView>();
  const weekScrollRef = useAnimatedRef<ScrollView>();
  const phaseScrollX = useSharedValue(0);
  const weekScrollX = useSharedValue(0);
  const phaseScrollWinX = useSharedValue(0);
  const phaseScrollWinW = useSharedValue(0);
  const weekScrollWinX = useSharedValue(0);
  const weekScrollWinW = useSharedValue(0);
  const phaseScrollLayoutW = useSharedValue(0);
  const phaseScrollContentW = useSharedValue(0);
  const weekScrollLayoutW = useSharedValue(0);
  const weekScrollContentW = useSharedValue(0);

  const onPhaseScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      phaseScrollX.value = e.contentOffset.x;
    },
  });
  const onWeekScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      weekScrollX.value = e.contentOffset.x;
    },
  });

  const phaseMidpointsRef = useRef<number[]>([]);
  const phaseMidpointsShared = useSharedValue<number[]>([]);
  const weekMidpointsRef = useRef<number[]>([]);
  const weekMidpointsShared = useSharedValue<number[]>([]);

  const handlePhaseScrollMeasureLayout = useCallback(
    (ev: any) => {
      phaseScrollLayoutW.value = ev.nativeEvent.layout.width;
      phaseScrollMeasureRef.current?.measureInWindow((x, _y, w, _h) => {
        phaseScrollWinX.value = x;
        phaseScrollWinW.value = w;
      });
    },
    [phaseScrollLayoutW, phaseScrollWinX, phaseScrollWinW]
  );

  const handleWeekScrollMeasureLayout = useCallback(
    (ev: any) => {
      weekScrollLayoutW.value = ev.nativeEvent.layout.width;
      weekScrollMeasureRef.current?.measureInWindow((x, _y, w, _h) => {
        weekScrollWinX.value = x;
        weekScrollWinW.value = w;
      });
    },
    [weekScrollLayoutW, weekScrollWinX, weekScrollWinW]
  );

  const handlePhaseTabLayout = useCallback(
    (i: number, layout: { x: number; width: number }, cnt: number) => {
      const mid = layout.x + layout.width / 2;
      phaseMidpointsRef.current[i] = mid;
      const next = new Array(cnt);
      for (let j = 0; j < cnt; j++) {
        next[j] =
          phaseMidpointsRef.current[j] ?? j * PHASE_SLOT_W + PHASE_SLOT_W / 2;
      }
      phaseMidpointsShared.value = next;
    },
    [phaseMidpointsShared]
  );

  const handleWeekPillLayout = useCallback(
    (i: number, layout: { x: number; width: number }, cnt: number) => {
      const mid = layout.x + layout.width / 2;
      weekMidpointsRef.current[i] = mid;
      const next = new Array(cnt);
      for (let j = 0; j < cnt; j++) {
        next[j] =
          weekMidpointsRef.current[j] ?? j * WEEK_SLOT_W + WEEK_SLOT_W / 2;
      }
      weekMidpointsShared.value = next;
    },
    [weekMidpointsShared]
  );

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

  const onMoveWorkoutToDayRef = useRef(onMoveWorkoutToDay);
  useEffect(() => {
    onMoveWorkoutToDayRef.current = onMoveWorkoutToDay;
  }, [onMoveWorkoutToDay]);
  const onCommitPhaseDropRef = useRef(onCommitPhaseDrop);
  useEffect(() => {
    onCommitPhaseDropRef.current = onCommitPhaseDrop;
  }, [onCommitPhaseDrop]);
  const onCommitWeekDropRef = useRef(onCommitWeekDrop);
  useEffect(() => {
    onCommitWeekDropRef.current = onCommitWeekDrop;
  }, [onCommitWeekDrop]);

  const updateHoveredDayRef = useRef(updateHoveredDay);
  useEffect(() => {
    updateHoveredDayRef.current = updateHoveredDay;
  }, [updateHoveredDay]);

  const handleWorkoutDropFromWorklet = useCallback(
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
      if (toDayOrder != null && toDayOrder !== fromDayOrder) {
        onMoveWorkoutToDayRef.current(fromDayOrder, workoutIndex, toDayOrder);
      }
    },
    []
  );

  const commitPhaseDropFromWorklet = useCallback(
    (fromIndex: number, toIndex: number) => {
      onCommitPhaseDropRef.current(fromIndex, toIndex);
    },
    []
  );

  const commitWeekDropFromWorklet = useCallback(
    (fromIndex: number, toIndex: number) => {
      onCommitWeekDropRef.current(fromIndex, toIndex);
    },
    []
  );

  const updateHoveredDayFromWorklet = useCallback((x: number, y: number) => {
    updateHoveredDayRef.current(x, y);
  }, []);

  // Keep midpoint arrays dense so drop preview works immediately.
  useEffect(() => {
    const cnt = params.phaseCount ?? 0;
    if (cnt <= 0) {
      phaseMidpointsRef.current = [];
      phaseMidpointsShared.value = [];
      return;
    }
    const next = new Array(cnt);
    for (let i = 0; i < cnt; i++) {
      next[i] =
        phaseMidpointsRef.current[i] ?? i * PHASE_SLOT_W + PHASE_SLOT_W / 2;
    }
    phaseMidpointsShared.value = next;
  }, [params.phaseCount, phaseMidpointsShared]);

  useEffect(() => {
    const cnt = params.weekCount ?? 0;
    if (cnt <= 0) {
      weekMidpointsRef.current = [];
      weekMidpointsShared.value = [];
      return;
    }
    const next = new Array(cnt);
    for (let i = 0; i < cnt; i++) {
      next[i] =
        weekMidpointsRef.current[i] ?? i * WEEK_SLOT_W + WEEK_SLOT_W / 2;
    }
    weekMidpointsShared.value = next;
  }, [params.weekCount, weekMidpointsShared]);

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
          const focus = dragFocusSectionShared.value;

          if (focus === 0) {
            globalUpdateTick.value += 1;
            if (globalUpdateTick.value % 4 !== 0) return;
            runOnJS(updateHoveredDayFromWorklet)(e.absoluteX, e.absoluteY);
            return;
          }

          if (focus === 1) {
            const left = phaseScrollWinX.value;
            const right = left + phaseScrollWinW.value;
            const maxX = Math.max(
              0,
              phaseScrollContentW.value - phaseScrollLayoutW.value
            );
            if (maxX > 0 && phaseScrollWinW.value > 0) {
              if (e.absoluteX < left + AUTO_SCROLL_EDGE_PX) {
                const p =
                  (left + AUTO_SCROLL_EDGE_PX - e.absoluteX) /
                  AUTO_SCROLL_EDGE_PX;
                const next = Math.max(
                  0,
                  phaseScrollX.value - AUTO_SCROLL_MAX_STEP_PX * p
                );
                if (Math.abs(next - phaseScrollX.value) > 0.25) {
                  phaseScrollX.value = next;
                  scrollTo(phaseScrollRef, next, 0, false);
                }
              } else if (e.absoluteX > right - AUTO_SCROLL_EDGE_PX) {
                const p =
                  (e.absoluteX - (right - AUTO_SCROLL_EDGE_PX)) /
                  AUTO_SCROLL_EDGE_PX;
                const next = Math.min(
                  maxX,
                  phaseScrollX.value + AUTO_SCROLL_MAX_STEP_PX * p
                );
                if (Math.abs(next - phaseScrollX.value) > 0.25) {
                  phaseScrollX.value = next;
                  scrollTo(phaseScrollRef, next, 0, false);
                }
              }
            }
            const xInContent =
              e.absoluteX - phaseScrollWinX.value + phaseScrollX.value;
            const mids = phaseMidpointsShared.value;
            if (mids.length > 0) {
              let to = mids.length - 1;
              for (let i = 0; i < mids.length; i++) {
                const raw = mids[i] as number;
                const mid =
                  raw > 0 && raw === raw
                    ? raw
                    : i * PHASE_SLOT_W + PHASE_SLOT_W / 2;
                if (xInContent < mid) {
                  to = i;
                  break;
                }
              }
              phaseDropTargetIndexShared.value = to;
            }
            return;
          }

          if (focus === 2) {
            const left = weekScrollWinX.value;
            const right = left + weekScrollWinW.value;
            const maxX = Math.max(
              0,
              weekScrollContentW.value - weekScrollLayoutW.value
            );
            if (maxX > 0 && weekScrollWinW.value > 0) {
              if (e.absoluteX < left + AUTO_SCROLL_EDGE_PX) {
                const p =
                  (left + AUTO_SCROLL_EDGE_PX - e.absoluteX) /
                  AUTO_SCROLL_EDGE_PX;
                const next = Math.max(
                  0,
                  weekScrollX.value - AUTO_SCROLL_MAX_STEP_PX * p
                );
                if (Math.abs(next - weekScrollX.value) > 0.25) {
                  weekScrollX.value = next;
                  scrollTo(weekScrollRef, next, 0, false);
                }
              } else if (e.absoluteX > right - AUTO_SCROLL_EDGE_PX) {
                const p =
                  (e.absoluteX - (right - AUTO_SCROLL_EDGE_PX)) /
                  AUTO_SCROLL_EDGE_PX;
                const next = Math.min(
                  maxX,
                  weekScrollX.value + AUTO_SCROLL_MAX_STEP_PX * p
                );
                if (Math.abs(next - weekScrollX.value) > 0.25) {
                  weekScrollX.value = next;
                  scrollTo(weekScrollRef, next, 0, false);
                }
              }
            }
            const xInContent =
              e.absoluteX - weekScrollWinX.value + weekScrollX.value;
            const mids = weekMidpointsShared.value;
            if (mids.length > 0) {
              let to = mids.length - 1;
              for (let i = 0; i < mids.length; i++) {
                const raw = mids[i] as number;
                const mid =
                  raw > 0 && raw === raw
                    ? raw
                    : i * WEEK_SLOT_W + WEEK_SLOT_W / 2;
                if (xInContent < mid) {
                  to = i;
                  break;
                }
              }
              weekDropTargetIndexShared.value = to;
            }
          }
        })
        .onEnd((e) => {
          if (dragModeShared.value !== 1) return;
          const focus = dragFocusSectionShared.value;
          if (focus === 1) {
            runOnJS(commitPhaseDropFromWorklet)(
              phaseDragFromIndexShared.value,
              phaseDropTargetIndexShared.value
            );
            return;
          }
          if (focus === 2) {
            runOnJS(commitWeekDropFromWorklet)(
              weekDragFromIndexShared.value,
              weekDropTargetIndexShared.value
            );
            return;
          }
          runOnJS(handleWorkoutDropFromWorklet)(
            e.absoluteX,
            e.absoluteY,
            dragFromDayOrder.value,
            dragWorkoutIndex.value
          );
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
          runOnJS(setDraggingWorkout)(null);
          runOnJS(setDraggingPhaseIndex)(null);
          runOnJS(setDraggingWeekIndex)(null);
        }),
    [
      commitPhaseDropFromWorklet,
      commitWeekDropFromWorklet,
      dragFocusSectionShared,
      dragFromDayOrder,
      dragModeShared,
      dragOverlayX,
      dragOverlayY,
      dragWorkoutIndex,
      focusRectH,
      focusRectW,
      focusRectX,
      focusRectY,
      globalUpdateTick,
      handleWorkoutDropFromWorklet,
      hoveredDayOrderShared,
      phaseDropTargetIndexShared,
      phaseDragFromIndexShared,
      phaseMidpointsShared,
      phaseScrollContentW,
      phaseScrollLayoutW,
      phaseScrollRef,
      phaseScrollWinW,
      phaseScrollWinX,
      phaseScrollX,
      updateHoveredDayFromWorklet,
      weekDropTargetIndexShared,
      weekDragFromIndexShared,
      weekMidpointsShared,
      weekScrollContentW,
      weekScrollLayoutW,
      weekScrollRef,
      weekScrollWinW,
      weekScrollWinX,
      weekScrollX,
    ]
  );

  useEffect(() => {
    if (
      !draggingWorkout &&
      draggingPhaseIndex == null &&
      draggingWeekIndex == null
    )
      return;
    rootContainerRef.current?.measureInWindow((x, y) => {
      rootLayoutRef.current = { x, y };
      rootLayoutX.value = x;
      rootLayoutY.value = y;
    });
  }, [
    draggingWorkout,
    draggingPhaseIndex,
    draggingWeekIndex,
    rootLayoutX,
    rootLayoutY,
  ]);

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
  const phaseOverlayStyle = dragOverlayChipStyle;
  const weekOverlayStyle = dragOverlayChipStyle;

  const carouselBackdropStyle = useAnimatedStyle(() => {
    const active =
      dragModeShared.value === 1 && dragFocusSectionShared.value !== 0;
    return {
      opacity: withTiming(active ? 1 : 0, { duration: active ? 120 : 160 }),
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

  const startDragWorkoutChip = useCallback(
    (args: {
      nativeEvent: any;
      fromDayOrder: number;
      workoutIndex: number;
      workoutTitle: string;
    }) => {
      const ne = args.nativeEvent as any;
      dragStartX.value = ne?.pageX ?? 0;
      dragStartY.value = ne?.pageY ?? 0;
      dragOverlayX.value = dragStartX.value;
      dragOverlayY.value = dragStartY.value;
      dragGrabOffsetX.value = ne?.locationX ?? 0;
      dragGrabOffsetY.value = (ne?.locationY ?? 0) + DRAG_LIFT_Y;
      dragModeShared.value = 1;
      dragFocusSectionShared.value = 0;
      dragFromDayOrder.value = args.fromDayOrder;
      dragWorkoutIndex.value = args.workoutIndex;
      rootContainerRef.current?.measureInWindow((x, y) => {
        rootLayoutRef.current = { x, y };
        rootLayoutX.value = x;
        rootLayoutY.value = y;
      });
      setDraggingWorkout({
        fromDayOrder: args.fromDayOrder,
        workoutIndex: args.workoutIndex,
        workoutTitle: args.workoutTitle,
      });
    },
    [
      dragFocusSectionShared,
      dragFromDayOrder,
      dragGrabOffsetX,
      dragGrabOffsetY,
      dragModeShared,
      dragOverlayX,
      dragOverlayY,
      dragStartX,
      dragStartY,
      dragWorkoutIndex,
      rootLayoutX,
      rootLayoutY,
    ]
  );

  const handlePhaseLongPress = useCallback(
    (index: number, nativeEvent: any) => {
      const ne = nativeEvent as any;
      dragStartX.value = ne?.pageX ?? 0;
      dragStartY.value = ne?.pageY ?? 0;
      dragOverlayX.value = dragStartX.value;
      dragOverlayY.value = dragStartY.value;
      dragGrabOffsetX.value = ne?.locationX ?? 0;
      dragGrabOffsetY.value = (ne?.locationY ?? 0) + DRAG_LIFT_Y;
      dragModeShared.value = 1;
      dragFocusSectionShared.value = 1;
      phaseDragFromIndexShared.value = index;
      phaseDropTargetIndexShared.value = index;
      phaseScrollMeasureRef.current?.measureInWindow((sx, _sy, sw, _sh) => {
        phaseScrollWinX.value = sx;
        phaseScrollWinW.value = sw;
      });
      rootContainerRef.current?.measureInWindow((rootX, rootY) => {
        rootLayoutRef.current = { x: rootX, y: rootY };
        rootLayoutX.value = rootX;
        rootLayoutY.value = rootY;
        phaseSectionRef.current?.measureInWindow((sx, sy, sw, sh) => {
          const pad = CAROUSEL_HOLE_PAD;
          focusRectX.value = Math.max(0, sx - rootX - pad);
          focusRectY.value = Math.max(0, sy - rootY - pad);
          focusRectW.value = sw + pad * 2;
          focusRectH.value = sh + pad * 2;
        });
      });
      setDraggingPhaseIndex(index);
    },
    [
      dragFocusSectionShared,
      dragGrabOffsetX,
      dragGrabOffsetY,
      dragModeShared,
      dragOverlayX,
      dragOverlayY,
      dragStartX,
      dragStartY,
      focusRectH,
      focusRectW,
      focusRectX,
      focusRectY,
      phaseDragFromIndexShared,
      phaseDropTargetIndexShared,
      phaseScrollWinW,
      phaseScrollWinX,
      rootLayoutX,
      rootLayoutY,
    ]
  );

  const handleWeekLongPress = useCallback(
    (index: number, nativeEvent: any) => {
      const ne = nativeEvent as any;
      dragStartX.value = ne?.pageX ?? 0;
      dragStartY.value = ne?.pageY ?? 0;
      dragOverlayX.value = dragStartX.value;
      dragOverlayY.value = dragStartY.value;
      dragGrabOffsetX.value = ne?.locationX ?? 0;
      dragGrabOffsetY.value = (ne?.locationY ?? 0) + DRAG_LIFT_Y;
      dragModeShared.value = 1;
      dragFocusSectionShared.value = 2;
      weekDragFromIndexShared.value = index;
      weekDropTargetIndexShared.value = index;
      weekScrollMeasureRef.current?.measureInWindow((sx, _sy, sw, _sh) => {
        weekScrollWinX.value = sx;
        weekScrollWinW.value = sw;
      });
      rootContainerRef.current?.measureInWindow((rootX, rootY) => {
        rootLayoutRef.current = { x: rootX, y: rootY };
        rootLayoutX.value = rootX;
        rootLayoutY.value = rootY;
        weekSectionRef.current?.measureInWindow((sx, sy, sw, sh) => {
          const pad = CAROUSEL_HOLE_PAD;
          focusRectX.value = Math.max(0, sx - rootX - pad);
          focusRectY.value = Math.max(0, sy - rootY - pad);
          focusRectW.value = sw + pad * 2;
          focusRectH.value = sh + pad * 2;
        });
      });
      setDraggingWeekIndex(index);
    },
    [
      dragFocusSectionShared,
      dragGrabOffsetX,
      dragGrabOffsetY,
      dragModeShared,
      dragOverlayX,
      dragOverlayY,
      dragStartX,
      dragStartY,
      focusRectH,
      focusRectW,
      focusRectX,
      focusRectY,
      rootLayoutX,
      rootLayoutY,
      weekDragFromIndexShared,
      weekDropTargetIndexShared,
      weekScrollWinW,
      weekScrollWinX,
    ]
  );

  return {
    // refs for layout measuring
    dayLayoutsRef,
    dayRowRefsRef,
    daysSectionRef,
    rootContainerRef,
    rootLayoutRef,
    phaseSectionRef,
    weekSectionRef,
    phaseScrollMeasureRef,
    weekScrollMeasureRef,

    // dragging state
    draggingWorkout,
    draggingPhaseIndex,
    draggingWeekIndex,

    // shared values for child components / visuals
    hoveredDayOrderShared,
    phaseDragFromIndexShared,
    phaseDropTargetIndexShared,
    weekDragFromIndexShared,
    weekDropTargetIndexShared,

    // scroll refs/handlers for sections
    phaseScrollRef,
    weekScrollRef,
    onPhaseScroll,
    onWeekScroll,
    setPhaseScrollContentW: (w: number) => {
      phaseScrollContentW.value = w;
    },
    setWeekScrollContentW: (w: number) => {
      weekScrollContentW.value = w;
    },

    // layout callbacks
    handlePhaseScrollMeasureLayout,
    handleWeekScrollMeasureLayout,
    handlePhaseTabLayout: (i: number, layout: { x: number; width: number }) =>
      handlePhaseTabLayout(i, layout, params.phaseCount),
    handleWeekPillLayout: (i: number, layout: { x: number; width: number }) =>
      handleWeekPillLayout(i, layout, params.weekCount),

    // gestures
    globalPanGesture,
    startDragWorkoutChip,
    handlePhaseLongPress,
    handleWeekLongPress,

    // animated styles
    dragOverlayChipStyle,
    phaseOverlayStyle,
    weekOverlayStyle,
    carouselBackdropStyle,
    carouselTopRegionStyle,
    carouselBottomRegionStyle,
    carouselLeftRegionStyle,
    carouselRightRegionStyle,
    phaseCarouselStyle,
    weekCarouselStyle,
  };
}
