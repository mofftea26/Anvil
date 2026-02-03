import type {
  DayWorkoutRef,
  ProgramDay,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  RectButton,
} from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutById } from "@/features/builder/api/workouts.api";
import { WorkoutCard } from "@/features/library/components/workouts/WorkoutCard";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useAppAlert, useTheme } from "@/shared/ui";

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

const SWIPE_CLOSE_THRESHOLD = 60;
const SHEET_HEIGHT_RATIO = 0.8;

function refToWorkoutRow(
  ref: DayWorkoutRef,
  workoutRowsMap: Record<string, WorkoutRow>,
  inlineWorkouts: ProgramTemplateState["workoutLibrary"]["inlineWorkouts"]
): WorkoutRow | null {
  if (!ref) return null;
  if (ref.source === "workoutsTable") {
    return workoutRowsMap[ref.workoutId] ?? null;
  }
  const inline = inlineWorkouts?.find((w) => w.id === ref.inlineWorkoutId);
  if (!inline) return null;
  return {
    id: inline.id,
    trainerId: "",
    title: inline.title,
    state: inline.state as WorkoutRow["state"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

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
  const theme = useTheme();
  const alert = useAppAlert();
  const insets = useSafeAreaInsets();
  const [resolvedRows, setResolvedRows] = useState<(WorkoutRow | null)[]>([]);
  const sheetTranslateY = useSharedValue(0);
  const sheetHeight = Dimensions.get("window").height * SHEET_HEIGHT_RATIO;

  useEffect(() => {
    if (visible) sheetTranslateY.value = 0;
  }, [visible, sheetTranslateY]);

  const refs = day?.workouts ?? (day?.workoutRef ? [day.workoutRef] : []);
  const count = refs.length;

  useEffect(() => {
    if (!visible || !day) {
      setResolvedRows([]);
      return;
    }
    const list = day.workouts ?? (day.workoutRef ? [day.workoutRef] : []);
    if (list.length === 0) {
      setResolvedRows([]);
      return;
    }
    const inline = state?.workoutLibrary?.inlineWorkouts ?? [];
    const initial = list.map((ref) =>
      refToWorkoutRow(ref, workoutRowsMap, inline)
    );
    setResolvedRows(initial);

    list.forEach((ref, i) => {
      if (initial[i] != null) return;
      if (ref?.source === "workoutsTable") {
        fetchWorkoutById(ref.workoutId).then((row) => {
          setResolvedRows((prev) => {
            const next = [...prev];
            if (i < next.length) next[i] = row ?? null;
            return next;
          });
        });
      }
    });
  }, [
    visible,
    day?.id,
    count,
    state?.workoutLibrary?.inlineWorkouts,
    workoutRowsMap,
    day,
  ]);

  const hasWorkouts = count > 0;

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

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(5)
        .onUpdate((e) => {
          if (e.translationY > 0) sheetTranslateY.value = e.translationY;
        })
        .onEnd((e) => {
          const ty = sheetTranslateY.value;
          if (ty > SWIPE_CLOSE_THRESHOLD) {
            sheetTranslateY.value = withTiming(400, { duration: 150 }, () => {
              scheduleOnRN(onClose);
            });
          } else {
            sheetTranslateY.value = withSpring(0, {
              damping: 20,
              stiffness: 300,
            });
          }
        }),
    [onClose, sheetTranslateY]
  );

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const sheetPalette = {
    backdrop: "rgba(0,0,0,0.62)",
    sheetBg: theme.colors.surface2 ?? theme.colors.surface,
    sheetBorder: hexToRgba(theme.colors.accent, 0.14),
    sheetShadow: hexToRgba(theme.colors.accent, 0.08),
    handle: hexToRgba(theme.colors.accent, 0.5),
    handleTrack: hexToRgba(theme.colors.accent, 0.12),
    headerGradientStart: hexToRgba(theme.colors.accent, 0.14),
    headerGradientMid: hexToRgba(theme.colors.accent2, 0.06),
    headerGradientEnd: "transparent",
    headerBorder: hexToRgba(theme.colors.accent, 0.1),
    title: theme.colors.text,
    subtitle: hexToRgba(theme.colors.textMuted, 0.95),
    addBtnBg: hexToRgba(theme.colors.accent, 0.22),
    addBtnBorder: hexToRgba(theme.colors.accent, 0.35),
    addBtnIcon: theme.colors.accent,
    emptyIconBg: hexToRgba(theme.colors.accent, 0.1),
    emptyIcon: theme.colors.accent,
    emptyText: theme.colors.text,
    emptyHint: hexToRgba(theme.colors.textMuted, 0.9),
    cardPlaceholderBg: hexToRgba(theme.colors.text, 0.05),
    swipeActionGradientStart: hexToRgba(theme.colors.danger, 0.42),
    swipeActionGradientEnd: hexToRgba(theme.colors.danger, 0.16),
    swipeActionText: "#fff",
  };

  const renderRightActionsForIndex = useCallback(
    (index: number) => {
      function SwipeableRightActions(
        _progress: unknown,
        _translation: unknown,
        _swipeableMethods: unknown
      ) {
        return (
          <View style={styles.rightActionWrap}>
            <RectButton
              style={styles.rightAction}
              onPress={() => handleRemoveWithConfirm(index)}
            >
              <View style={styles.rightActionInner}>
                <LinearGradient
                  colors={[
                    sheetPalette.swipeActionGradientStart,
                    sheetPalette.swipeActionGradientEnd,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Icon
                  name="trash"
                  size={22}
                  color={sheetPalette.swipeActionText}
                />
                <Text style={styles.rightActionText}>
                  {t("library.programsScreen.removeWorkout", "Remove")}
                </Text>
              </View>
            </RectButton>
          </View>
        );
      }
      return SwipeableRightActions;
    },
    [
      handleRemoveWithConfirm,
      t,
      sheetPalette.swipeActionGradientStart,
      sheetPalette.swipeActionGradientEnd,
      sheetPalette.swipeActionText,
    ]
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <GestureHandlerRootView style={styles.backdropRoot}>
        <View
          style={[
            styles.backdrop,
            { paddingTop: insets.top, backgroundColor: sheetPalette.backdrop },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

          <AnimatedView
            style={[
              styles.sheet,
              {
                backgroundColor: sheetPalette.sheetBg,
                height: sheetHeight,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderColor: sheetPalette.sheetBorder,
                shadowColor: sheetPalette.sheetShadow,
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
                  { backgroundColor: sheetPalette.handleTrack },
                ]}
              >
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: sheetPalette.handle },
                  ]}
                />
              </View>
            </GestureDetector>

            <View style={styles.header}>
              <LinearGradient
                colors={[
                  sheetPalette.headerGradientStart,
                  sheetPalette.headerGradientMid,
                  sheetPalette.headerGradientEnd,
                ]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[styles.headerContent, { paddingHorizontal: 20 }]}>
                <View style={styles.headerCenter}>
                  <Text
                    weight="bold"
                    style={[styles.headerTitle, { color: sheetPalette.title }]}
                  >
                    {t(
                      "library.programsScreen.weekDayHeader",
                      "Week {{week}} · {{day}}",
                      {
                        week: weekIndex + 1,
                        day: dayLabel,
                      }
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.headerSubtitle,
                      { color: sheetPalette.subtitle },
                    ]}
                  >
                    {hasWorkouts
                      ? t("library.programsScreen.workoutCount", { count })
                      : t(
                          "library.programsScreen.noWorkoutsThisDay",
                          "No workouts this day"
                        )}
                  </Text>
                </View>

                <Pressable
                  onPress={onAddWorkout}
                  style={({ pressed }) => [
                    styles.addBtn,
                    {
                      backgroundColor: sheetPalette.addBtnBg,
                      borderWidth: 1,
                      borderColor: sheetPalette.addBtnBorder,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    },
                  ]}
                >
                  <Icon
                    name="add-circle-outline"
                    size={26}
                    color={sheetPalette.addBtnIcon}
                  />
                </Pressable>
              </View>
              <View
                style={[
                  styles.headerBorder,
                  { backgroundColor: sheetPalette.headerBorder },
                ]}
              />
            </View>

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
                  <View style={styles.empty}>
                    <View
                      style={[
                        styles.emptyIconRing,
                        {
                          backgroundColor: sheetPalette.emptyIconBg,
                        },
                      ]}
                    >
                      <Icon
                        name="barbell-outline"
                        size={48}
                        color={sheetPalette.emptyIcon}
                        style={styles.emptyIcon}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyText,
                        { color: sheetPalette.emptyText },
                      ]}
                    >
                      {t(
                        "library.programsScreen.noWorkoutsThisDay",
                        "No workouts this day"
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.emptyHint,
                        { color: sheetPalette.emptyHint },
                      ]}
                    >
                      {t(
                        "library.programsScreen.tapAddToAddWorkout",
                        "Tap + above to add a workout"
                      )}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardList}>
                    {refs.map((ref, index) => {
                      const row = resolvedRows[index];
                      const tableId =
                        ref?.source === "workoutsTable" ? ref.workoutId : null;
                      return (
                        <Swipeable
                          key={index}
                          friction={2}
                          rightThreshold={40}
                          overshootRight={false}
                          renderRightActions={renderRightActionsForIndex(index)}
                        >
                          <View style={styles.cardFullWidth}>
                            {row ? (
                              <WorkoutCard
                                workout={row}
                                updatedAtLabel={t(
                                  "library.workoutsList.updatedAt"
                                )}
                                defaultTitle={t(
                                  "builder.workoutDetails.defaultTitle",
                                  "Untitled workout"
                                )}
                                onPress={() => {
                                  if (tableId) handleCardPress(tableId);
                                }}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.cardPlaceholder,
                                  {
                                    backgroundColor:
                                      sheetPalette.cardPlaceholderBg,
                                  },
                                ]}
                              >
                                <ActivityIndicator
                                  size="small"
                                  color={theme.colors.accent}
                                />
                                <Text
                                  style={{
                                    color: theme.colors.textMuted,
                                    marginTop: 8,
                                    fontSize: 13,
                                  }}
                                >
                                  Loading…
                                </Text>
                              </View>
                            )}
                          </View>
                        </Swipeable>
                      );
                    })}
                  </View>
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
  header: {
    position: "relative",
    paddingTop: 2,
    paddingBottom: 18,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
    justifyContent: "flex-start",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  headerBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    minHeight: 260,
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: { marginBottom: 0 },
  emptyText: {
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
  },
  cardList: { gap: 16 },
  cardFullWidth: { width: "100%" },
  cardPlaceholder: {
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  rightActionWrap: {
    width: 86,
    height: 80,
    paddingLeft: 6,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
  rightAction: {
    width: 80,
    height: 80,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  rightActionInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  rightActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
