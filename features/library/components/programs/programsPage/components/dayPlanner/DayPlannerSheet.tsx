import type {
  ProgramDay,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { router } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  createAnimatedComponent,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useAppAlert } from "@/shared/ui";

import { DayPlannerEmptyState } from "./components/DayPlannerEmptyState";
import { DayPlannerHeader } from "./components/DayPlannerHeader";
import { DayPlannerSwipeHint } from "./components/DayPlannerSwipeHint";
import { DayPlannerWorkoutList } from "./components/DayPlannerWorkoutList";
import { useDayPlannerPalette } from "./hooks/useDayPlannerPalette";
import { useResolvedWorkoutRows } from "./hooks/useResolvedWorkoutRows";
import { useSheetPanGesture } from "./hooks/useSheetPanGesture";
import { useSwipeHintAnimation } from "./hooks/useSwipeHintAnimation";

const AnimatedView = createAnimatedComponent(View);

type Props = {
  visible: boolean;
  weekIndex: number;
  dayLabel: string;
  day: ProgramDay | null;
  state: ProgramTemplateState | null;
  workoutRowsMap: Record<string, WorkoutRow>;
  onClose: () => void;
  onAddWorkout: () => void;
  onRemoveWorkoutAt: (workoutIndex: number) => void;
};

const SHEET_HEIGHT_RATIO = 0.8;

export function DayPlannerSheet({
  visible,
  weekIndex,
  dayLabel,
  day,
  state,
  workoutRowsMap,
  onClose,
  onAddWorkout,
  onRemoveWorkoutAt,
}: Props) {
  const { t } = useAppTranslation();
  const alert = useAppAlert();
  const insets = useSafeAreaInsets();
  const sheetTranslateY = useSharedValue(0);
  const swipeHintOffset = useSharedValue(0);
  const sheetHeight = Dimensions.get("window").height * SHEET_HEIGHT_RATIO;

  const { resolvedRows, count } = useResolvedWorkoutRows({
    visible,
    day,
    state,
    workoutRowsMap,
  });

  useEffect(() => {
    if (visible) sheetTranslateY.value = 0;
  }, [visible, sheetTranslateY]);

  const palette = useDayPlannerPalette();
  const swipeHintArrowStyle = useSwipeHintAnimation({
    visible,
    count,
    swipeHintOffset,
  });

  const hasWorkouts = count > 0;
  const refs = day?.workouts ?? (day?.workoutRef ? [day.workoutRef] : []);

  const handleCardPress = useCallback(
    (workoutId: string) => {
      onClose();
      router.push(
        `/(trainer)/library/workout-builder/${workoutId}` as Parameters<
          typeof router.push
        >[0]
      );
    },
    [onClose]
  );

  const handleRemoveWithConfirm = useCallback(
    (index: number) => {
      alert.confirm({
        title: t(
          "library.programsScreen.removeWorkoutConfirm",
          "Remove workout from this day?"
        ),
        confirmText: t("library.programsScreen.removeWorkout", "Remove"),
        cancelText: t("common.cancel", "Cancel"),
        destructive: true,
        onConfirm: () => onRemoveWorkoutAt(index),
      });
    },
    [alert, t, onRemoveWorkoutAt]
  );

  const { gesture: panGesture, animatedStyle: sheetAnimatedStyle } =
    useSheetPanGesture({ onClose, sheetTranslateY });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <GestureHandlerRootView style={styles.backdropRoot}>
        <View
          style={[
            styles.backdrop,
            { paddingTop: insets.top, backgroundColor: palette.backdrop },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

          <AnimatedView
            style={[
              styles.sheet,
              {
                backgroundColor: palette.sheetBg,
                height: sheetHeight,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: palette.sheetBorder,
                shadowColor: palette.sheetShadow,
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 1,
                shadowRadius: 28,
                elevation: 28,
              },
              sheetAnimatedStyle,
            ]}
          >
            <GestureDetector gesture={panGesture}>
              <View
                style={[
                  styles.handleWrap,
                  { backgroundColor: palette.handleTrack },
                ]}
              >
                <View
                  style={[styles.handle, { backgroundColor: palette.handle }]}
                />
              </View>
            </GestureDetector>

            <DayPlannerHeader
              weekIndex={weekIndex}
              dayLabel={dayLabel}
              hasWorkouts={hasWorkouts}
              count={count}
              palette={palette}
              onAddWorkout={onAddWorkout}
            />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(20, insets.bottom + 8) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.scrollContentInner}>
                {!hasWorkouts ? (
                  <DayPlannerEmptyState palette={palette} />
                ) : (
                  <>
                    <DayPlannerSwipeHint
                      palette={palette}
                      arrowStyle={swipeHintArrowStyle}
                    />
                    <DayPlannerWorkoutList
                      refs={refs}
                      resolvedRows={resolvedRows}
                      onOpenWorkout={handleCardPress}
                      onRemoveAt={handleRemoveWithConfirm}
                      palette={palette}
                    />
                  </>
                )}
              </View>
            </ScrollView>
          </AnimatedView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropRoot: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
