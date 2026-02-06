import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { createAnimatedComponent, useAnimatedStyle, withSpring } from "react-native-reanimated";

import type { ProgramDay } from "@/features/library/types/programTemplate";
import type { DraggingWorkoutState } from "@/features/library/screens/program-template-editor/types";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

const AnimatedView = createAnimatedComponent(View);

function DayRowWithScale(props: {
  dayOrder: number;
  hoveredDayOrderShared: any; // SharedValue<number>
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const isHover = props.hoveredDayOrderShared.value === props.dayOrder;
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
  return <AnimatedView style={style}>{props.children}</AnimatedView>;
}

export function ProgramTemplateEditorDaysSection(props: {
  phaseTitle: string;
  weekLabel: string;
  days: ProgramDay[];
  dayLabels: readonly string[];
  dragging: DraggingWorkoutState | null;
  clampedPhaseIndex: number;
  clampedWeekIndex: number;
  hoveredDayOrderShared: any; // SharedValue<number>
  daysSectionRef: React.RefObject<View | null>;
  dayRowRefsRef: React.MutableRefObject<Record<number, View | null>>;
  dayLayoutsRef: React.MutableRefObject<
    Record<number, { x: number; y: number; width: number; height: number }>
  >;
  onDuplicateWeek: () => void;
  onOpenDayPlanner: (dayOrder: number) => void;
  onStartDragWorkoutChip: (args: {
    nativeEvent: any;
    fromDayOrder: number;
    workoutIndex: number;
    workoutTitle: string;
  }) => void;
  getDayWorkoutTitles: (day: ProgramDay) => string[];
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const onMeasureDayRow = useCallback(
    (dayOrder: number) => {
      const rowRef = props.dayRowRefsRef.current[dayOrder];
      if (rowRef && typeof (rowRef as any).measureInWindow === "function") {
        (rowRef as any).measureInWindow(
          (x: number, y: number, w: number, h: number) => {
            props.dayLayoutsRef.current[dayOrder] = { x, y, width: w, height: h };
          }
        );
      }
    },
    [props.dayLayoutsRef, props.dayRowRefsRef]
  );

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text
          weight="semibold"
          style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
        >
          {props.phaseTitle} · {props.weekLabel}
        </Text>
        <Pressable
          onPress={props.onDuplicateWeek}
          style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Icon name="copy-outline" size={18} color={theme.colors.accent} />
        </Pressable>
      </View>

      <View ref={props.daysSectionRef} style={styles.daysList}>
        {props.days.map((day) => {
          const titles = props.getDayWorkoutTitles(day);
          const dayLabel = props.dayLabels[day.order] ?? day.label;
          const hasWorkouts = titles.length > 0;

          return (
            <DayRowWithScale
              key={day.id}
              dayOrder={day.order}
              hoveredDayOrderShared={props.hoveredDayOrderShared}
            >
              <Pressable
                ref={(r) => {
                  props.dayRowRefsRef.current[day.order] = r as View | null;
                }}
                onLayout={() => onMeasureDayRow(day.order)}
                onPress={() => props.onOpenDayPlanner(day.order)}
                style={({ pressed }) => [
                  styles.dayRow,
                  {
                    backgroundColor: theme.colors.surface3 ?? theme.colors.background,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Text
                  weight="semibold"
                  style={[styles.dayRowLabel, { color: theme.colors.textMuted }]}
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
                          backgroundColor: hexToRgba(theme.colors.textMuted, 0.12),
                        },
                      ]}
                    >
                      <Icon
                        name="barbell-outline"
                        size={14}
                        color={theme.colors.textMuted}
                      />
                      <Text
                        style={[styles.workoutChipText, { color: theme.colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {t("library.programsScreen.addWorkoutDay", "Add workout")}
                      </Text>
                    </View>
                  ) : (
                    titles.map((workoutTitle, idx) => {
                      const isThisChipDragging =
                        props.dragging &&
                        props.dragging.fromDayOrder === day.order &&
                        props.dragging.workoutIndex === idx;

                      if (isThisChipDragging) {
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.workoutChip,
                              {
                                backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                                opacity: 0,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.workoutChipText, { color: theme.colors.text }]}
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
                          onLongPress={(e) =>
                            props.onStartDragWorkoutChip({
                              nativeEvent: (e as any).nativeEvent,
                              fromDayOrder: day.order,
                              workoutIndex: idx,
                              workoutTitle,
                            })
                          }
                          onPress={() => props.onOpenDayPlanner(day.order)}
                        >
                          <View
                            style={[
                              styles.workoutChip,
                              {
                                backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                              },
                            ]}
                          >
                            <Text
                              style={[styles.workoutChipText, { color: theme.colors.text }]}
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
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 8,
    marginBottom: 8,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  copyBtn: { padding: 8, marginRight: -8 },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 0,
    marginTop: 0,
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
  dayRowLabel: { fontSize: 13, width: 32 },
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
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  workoutChipText: { fontSize: 12, fontWeight: "600" },
});

