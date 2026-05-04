import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  DEFAULT_SCHEDULE_TIME,
  formatScheduleTimeLabel,
  minutesToScheduleTime,
  scheduleTimeToMinutes,
} from "@/shared/utils/scheduleTime";

import { HStack, VStack } from "../layout/Stack";
import { useTheme } from "../theme";
import { Icon } from "../components/Icon";
import { Text } from "../components/Text";

const HOUR_START = 0;
const HOUR_END = 23;
const HOUR_HEIGHT = 56;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type TimelineDay = {
  dateKey: string;
  dayLabel: string;
  dayNumber: string;
  isToday: boolean;
  isActive: boolean;
  hasWorkouts?: boolean;
};

export type TimelineItem = {
  id: string;
  dateKey: string;
  title: string;
  subtitle?: string | null;
  scheduledTime: string | null;
  sourceColor: string;
  statusLabel?: string | null;
  statusColor?: string;
};

export type TimelineBoardProps = {
  title?: string;
  monthLabel?: string;
  monthIndex?: number;
  year?: number;
  days: TimelineDay[];
  items: TimelineItem[];
  canDrag?: boolean;
  onPressItem?: (itemId: string) => void;
  onDropTime?: (itemId: string, newTime: string) => void;
  onSelectDay?: (dateKey: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onChangeMonthYear?: (monthIndex: number, year: number) => void;
  /**
   * Optional render override for the inside of an item card. When omitted, the
   * default workout-card layout is rendered (source dot, time, title,
   * subtitle, status). The callback receives the live time label so callers
   * can render their own header without re-implementing the drag preview.
   */
  renderItemContent?: (
    item: TimelineItem,
    extras: { liveTimeLabel: string }
  ) => React.ReactNode;
  /**
   * Optional muted footer hint rendered below the timeline scroll area.
   * Useful for "Drag items to set their time" style instructions.
   */
  bottomHintText?: string;
};

function DraggableItem(props: {
  top: number;
  item: TimelineItem;
  canDrag: boolean;
  onPress?: (itemId: string) => void;
  onDropTime?: (itemId: string, newTime: string) => void;
  onDragPreviewHour?: (hour: number | null) => void;
  renderItemContent?: TimelineBoardProps["renderItemContent"];
}) {
  const theme = useTheme();
  const { canDrag, item, top, onPress, onDropTime, onDragPreviewHour, renderItemContent } = props;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dragging = useRef(false);
  const previewHourRef = useRef<number | null>(null);
  const [dragPreviewTimeLabel, setDragPreviewTimeLabel] = useState<string | null>(null);
  const baseMinutes = scheduleTimeToMinutes(item.scheduledTime ?? DEFAULT_SCHEDULE_TIME);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          canDrag &&
          Math.abs(gesture.dy) > 2 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          dragging.current = true;
          previewHourRef.current = Math.floor(baseMinutes / 60);
          onDragPreviewHour?.(previewHourRef.current);
          Animated.timing(scale, {
            toValue: 1.03,
            duration: 80,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(gesture.dy);
          const movedMinutes = Math.round((gesture.dy / HOUR_HEIGHT) * 60);
          const previewMinutes = Math.max(
            HOUR_START * 60,
            Math.min(HOUR_END * 60 + 55, baseMinutes + movedMinutes)
          );
          const previewHour = Math.floor(previewMinutes / 60);
          if (previewHourRef.current !== previewHour) {
            previewHourRef.current = previewHour;
            onDragPreviewHour?.(previewHour);
          }
          setDragPreviewTimeLabel(formatScheduleTimeLabel(minutesToScheduleTime(previewMinutes)));
        },
        onPanResponderRelease: (_, gesture) => {
          dragging.current = false;
          const movedMinutes = Math.round((gesture.dy / HOUR_HEIGHT) * 60);
          const snappedMinutes = Math.round((baseMinutes + movedMinutes) / 5) * 5;
          const minBound = HOUR_START * 60;
          const maxBound = HOUR_END * 60 + 55;
          const clamped = Math.max(minBound, Math.min(maxBound, snappedMinutes));
          onDropTime?.(item.id, minutesToScheduleTime(clamped));
          // Snappier reset than spring.
          Animated.timing(translateY, {
            toValue: 0,
            duration: 70,
            useNativeDriver: true,
          }).start();
          Animated.timing(scale, {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }).start();
          previewHourRef.current = null;
          onDragPreviewHour?.(null);
          setDragPreviewTimeLabel(null);
        },
        onPanResponderTerminate: () => {
          dragging.current = false;
          translateY.setValue(0);
          scale.setValue(1);
          previewHourRef.current = null;
          onDragPreviewHour?.(null);
          setDragPreviewTimeLabel(null);
        },
      }),
    [baseMinutes, canDrag, item.id, onDragPreviewHour, onDropTime, scale, translateY]
  );

  const liveTimeLabel = dragPreviewTimeLabel ?? formatScheduleTimeLabel(item.scheduledTime);

  return (
    <Animated.View
      {...(canDrag ? panResponder.panHandlers : {})}
      style={[
        styles.assignmentCard,
        {
          top,
          left: 6,
          right: 6,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          transform: [{ translateY }, { scale }],
          shadowColor: theme.colors.text,
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          if (!dragging.current) onPress?.(item.id);
        }}
      >
        {renderItemContent ? (
          renderItemContent(item, { liveTimeLabel })
        ) : (
          <VStack style={{ gap: 4 }}>
            <HStack align="center" justify="space-between">
              <View style={[styles.sourceDot, { backgroundColor: item.sourceColor }]} />
              <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                {liveTimeLabel}
              </Text>
            </HStack>
            <Text weight="semibold" numberOfLines={1} style={{ fontSize: 13 }}>
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text numberOfLines={1} style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                {item.subtitle}
              </Text>
            ) : null}
            {item.statusLabel ? (
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: item.statusColor ?? theme.colors.textMuted,
                }}
              >
                {item.statusLabel}
              </Text>
            ) : null}
          </VStack>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function TimelineBoard(props: TimelineBoardProps) {
  const theme = useTheme();
  const YEAR_ITEM_HEIGHT = 44;
  const totalHeight = (HOUR_END - HOUR_START + 1) * HOUR_HEIGHT;
  const hourMarks = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, idx) => HOUR_START + idx),
    []
  );

  const itemsByDay = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const item of props.items) {
      const arr = map.get(item.dateKey);
      if (arr) arr.push(item);
      else map.set(item.dateKey, [item]);
    }
    for (const [key, value] of map.entries()) {
      value.sort((a, b) => {
        const tDiff = scheduleTimeToMinutes(a.scheduledTime) - scheduleTimeToMinutes(b.scheduledTime);
        if (tDiff !== 0) return tDiff;
        return a.id.localeCompare(b.id);
      });
      map.set(key, value);
    }
    return map;
  }, [props.items]);
  const activeDay = useMemo(
    () =>
      props.days.find((d) => d.isActive) ??
      props.days.find((d) => d.isToday) ??
      props.days[0] ??
      null,
    [props.days]
  );
  const activeDayItems = useMemo(
    () => (activeDay ? itemsByDay.get(activeDay.dateKey) ?? [] : []),
    [activeDay, itemsByDay]
  );
  const [dragPreviewHour, setDragPreviewHour] = useState<number | null>(null);
  const activeWorkoutHours = useMemo(() => {
    const set = new Set<number>();
    for (const item of activeDayItems) {
      const mins = scheduleTimeToMinutes(item.scheduledTime);
      set.add(Math.floor(mins / 60));
    }
    return set;
  }, [activeDayItems]);
  const years = useMemo(() => {
    const base = props.year ?? new Date().getFullYear();
    return Array.from({ length: 61 }, (_, i) => base - 30 + i);
  }, [props.year]);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerTab, setPickerTab] = React.useState<"month" | "year">("month");
  const [draftMonth, setDraftMonth] = React.useState(props.monthIndex ?? new Date().getMonth());
  const [draftYear, setDraftYear] = React.useState(props.year ?? new Date().getFullYear());
  const sheetAnimY = useRef(new Animated.Value(30)).current;
  const sheetAnimOpacity = useRef(new Animated.Value(0)).current;
  const yearScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    sheetAnimY.setValue(30);
    sheetAnimOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(sheetAnimY, { toValue: 0, duration: 190, useNativeDriver: true }),
      Animated.timing(sheetAnimOpacity, { toValue: 1, duration: 190, useNativeDriver: true }),
    ]).start();
  }, [pickerOpen, sheetAnimOpacity, sheetAnimY]);

  useEffect(() => {
    if (!pickerOpen || pickerTab !== "year") return;
    const selectedIdx = Math.max(0, years.findIndex((y) => y === draftYear));
    const timer = setTimeout(() => {
      yearScrollRef.current?.scrollTo({
        y: Math.max(0, selectedIdx * YEAR_ITEM_HEIGHT),
        animated: false,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [YEAR_ITEM_HEIGHT, draftYear, pickerOpen, pickerTab, years]);

  return (
    <View style={[styles.container, { backgroundColor: "transparent", flex: 1 }]}>
      <VStack style={{ gap: 10 }}>
        <HStack align="center" justify="space-between">
          {props.title ? (
            <Text weight="bold" style={{ fontSize: 18 }}>
              {props.title}
            </Text>
          ) : <View />}
          <Pressable
            onPress={() => {
              setDraftMonth(props.monthIndex ?? new Date().getMonth());
              setDraftYear(props.year ?? new Date().getFullYear());
              setPickerTab("month");
              setPickerOpen(true);
            }}
            style={({ pressed }) => [
              styles.monthTrigger,
              {
                opacity: pressed ? 0.84 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text weight="semibold" style={{ fontSize: 13 }}>
              {props.monthLabel ?? ""}
            </Text>
          </Pressable>
        </HStack>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {props.days.map((day) => (
            <Pressable
              key={day.dateKey}
              onPress={() => props.onSelectDay?.(day.dateKey)}
              style={({ pressed }) => [
                styles.dayPill,
                {
                  opacity: pressed ? 0.86 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  flex: 1,
                  borderColor: day.isActive ? theme.colors.accent : theme.colors.border,
                  backgroundColor: day.isActive ? theme.colors.surface : theme.colors.surface2,
                },
              ]}
            >
              <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}>{day.dayLabel}</Text>
              <Text weight="bold" style={{ fontSize: 14 }}>
                {day.dayNumber}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  {
                    backgroundColor: day.hasWorkouts ? theme.colors.accent : "transparent",
                    borderColor: day.hasWorkouts ? theme.colors.accent : theme.colors.border,
                  },
                ]}
              />
            </Pressable>
          ))}
        </ScrollView>
      </VStack>

      <ScrollView
        style={{ flex: 1, marginTop: 12 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: totalHeight, paddingBottom: 8 }}
      >
        <HStack>
          <View style={{ width: 78, position: "relative" }}>
            <View style={[styles.timeConnector, { backgroundColor: theme.colors.border }]} />
            {hourMarks.map((hour) => (
              <View
                key={hour}
                style={styles.hourRow}
              >
                <Text
                  style={[
                    styles.timeLabel,
                    {
                      color:
                        dragPreviewHour === hour
                          ? theme.colors.text
                          : activeWorkoutHours.has(hour)
                            ? theme.colors.text
                            : theme.colors.textMuted,
                      backgroundColor: theme.colors.surface2,
                      borderColor:
                        dragPreviewHour === hour || activeWorkoutHours.has(hour)
                          ? theme.colors.accent
                          : "transparent",
                    },
                  ]}
                >
                  {hour === 0
                    ? "12 AM"
                    : hour === 12
                      ? "12 PM"
                      : hour > 12
                        ? `${hour - 12} PM`
                        : `${hour} AM`}
                </Text>
              </View>
            ))}
          </View>
          <View style={[styles.singleColumn]}>
            <View style={{ height: totalHeight, position: "relative" }}>
              {(() => {
                const laneUsage = new Map<number, number>();
                return activeDayItems.map((item) => {
                  const min = scheduleTimeToMinutes(item.scheduledTime);
                  const key = Math.floor(min / 15);
                  const lane = laneUsage.get(key) ?? 0;
                  laneUsage.set(key, lane + 1);
                  return (
                    <DraggableItem
                      key={item.id}
                      item={item}
                      canDrag={Boolean(props.canDrag)}
                      top={((min - HOUR_START * 60) / 60) * HOUR_HEIGHT + 6 + lane * 8}
                      onPress={props.onPressItem}
                      onDropTime={props.onDropTime}
                      onDragPreviewHour={setDragPreviewHour}
                      renderItemContent={props.renderItemContent}
                    />
                  );
                });
              })()}
            </View>
          </View>
        </HStack>
      </ScrollView>

      {props.bottomHintText ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 6 }}>
          {props.bottomHintText}
        </Text>
      ) : null}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.sheetRoot}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPickerOpen(false)} />
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                opacity: sheetAnimOpacity,
                transform: [{ translateY: sheetAnimY }],
              },
            ]}
          >
            <View style={[styles.grabHandle, { backgroundColor: theme.colors.border }]} />

            <HStack align="center" justify="space-between" style={{ marginTop: 4 }}>
              <Text weight="bold" style={{ fontSize: 17 }} numberOfLines={1}>
                {`${MONTHS[draftMonth] ?? ""} ${draftYear}`}
              </Text>
              <HStack gap={8} align="center">
                <Pressable
                  onPress={() => {
                    const now = new Date();
                    const resetMonth = now.getMonth();
                    const resetYear = now.getFullYear();
                    setDraftMonth(resetMonth);
                    setDraftYear(resetYear);
                    props.onChangeMonthYear?.(resetMonth, resetYear);
                    setPickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.resetIconBtn,
                    {
                      opacity: pressed ? 0.78 : 1,
                      backgroundColor: theme.colors.surface2,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Reset to current month"
                >
                  <Icon name="refresh" size={16} color={theme.colors.accent} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    props.onChangeMonthYear?.(draftMonth, draftYear);
                    setPickerOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.resetIconBtn,
                    {
                      opacity: pressed ? 0.78 : 1,
                      backgroundColor: theme.colors.accent,
                      borderColor: theme.colors.accent,
                    },
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Apply selected date"
                >
                  <Icon name="checkmark" size={16} color={theme.colors.background} strokeWidth={2.4} />
                </Pressable>
              </HStack>
            </HStack>

            <View style={[styles.segmentedControl, { backgroundColor: theme.colors.surface2 }]}>
              <Pressable
                onPress={() => setPickerTab("month")}
                style={({ pressed }) => [
                  styles.segmentedTab,
                  {
                    opacity: pressed ? 0.88 : 1,
                    backgroundColor: pickerTab === "month" ? theme.colors.surface3 : "transparent",
                  },
                ]}
              >
                <Text
                  weight={pickerTab === "month" ? "bold" : "semibold"}
                  style={{ color: pickerTab === "month" ? theme.colors.text : theme.colors.textMuted, fontSize: 13 }}
                >
                  Month
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPickerTab("year")}
                style={({ pressed }) => [
                  styles.segmentedTab,
                  {
                    opacity: pressed ? 0.88 : 1,
                    backgroundColor: pickerTab === "year" ? theme.colors.surface3 : "transparent",
                  },
                ]}
              >
                <Text
                  weight={pickerTab === "year" ? "bold" : "semibold"}
                  style={{ color: pickerTab === "year" ? theme.colors.text : theme.colors.textMuted, fontSize: 13 }}
                >
                  Year
                </Text>
              </Pressable>
            </View>

            {pickerTab === "month" ? (
              <View style={styles.monthBoard}>
                {MONTHS.map((m, idx) => {
                  const active = draftMonth === idx;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setDraftMonth(idx);
                      }}
                      style={({ pressed }) => [
                        styles.monthTile,
                        {
                          opacity: pressed ? 0.82 : 1,
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.monthCircle,
                          active
                            ? { backgroundColor: theme.colors.accent }
                            : { backgroundColor: "transparent" },
                        ]}
                      >
                        <Text
                          weight={active ? "bold" : "semibold"}
                          style={{
                            fontSize: 15,
                            color: active ? theme.colors.background : theme.colors.text,
                          }}
                        >
                          {m}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.yearWheelFrame}>
                <View
                  pointerEvents="none"
                  style={[
                    styles.yearWheelBand,
                    { backgroundColor: theme.colors.surface2 },
                  ]}
                />
                <ScrollView
                  ref={yearScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={YEAR_ITEM_HEIGHT}
                  decelerationRate="fast"
                  contentContainerStyle={{
                    paddingVertical: YEAR_ITEM_HEIGHT * 2,
                  }}
                  onMomentumScrollEnd={(event) => {
                    const offsetY = event.nativeEvent.contentOffset.y;
                    const idx = Math.max(0, Math.min(years.length - 1, Math.round(offsetY / YEAR_ITEM_HEIGHT)));
                    const yearValue = years[idx];
                    setDraftYear(yearValue);
                  }}
                  style={{ flex: 1 }}
                >
                  {years.map((yearValue) => {
                    const active = yearValue === draftYear;
                    return (
                      <Pressable
                        key={yearValue}
                        onPress={() => {
                          setDraftYear(yearValue);
                          const idx = years.findIndex((y) => y === yearValue);
                          yearScrollRef.current?.scrollTo({
                            y: Math.max(0, idx * YEAR_ITEM_HEIGHT),
                            animated: true,
                          });
                        }}
                        style={({ pressed }) => [
                          styles.yearWheelItem,
                          {
                            opacity: pressed ? 0.88 : active ? 1 : 0.55,
                          },
                        ]}
                      >
                        <Text
                          weight={active ? "bold" : "semibold"}
                          style={{
                            fontSize: active ? 22 : 16,
                            color: active ? theme.colors.accent : theme.colors.textMuted,
                          }}
                        >
                          {yearValue}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  monthTrigger: {
    minHeight: 34,
    minWidth: 136,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayPill: {
    minHeight: 58,
    minWidth: 40,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  hourRow: {
    height: HOUR_HEIGHT,
    justifyContent: "center",
    paddingRight: 6,
    paddingLeft: 0,
    position: "relative",
  },
  singleColumn: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
    overflow: "hidden",
  },
  timeLabel: {
    fontSize: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
    minWidth: 34,
    textAlign: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontWeight: "600",
  },
  timeConnector: {
    position: "absolute",
    left: 49,
    top: 0,
    bottom: 0,
    width: 1,
    borderRadius: 999,
    opacity: 1,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  assignmentCard: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    minHeight: 56,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },
  grabHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
    opacity: 0.7,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 2,
    marginTop: 14,
    gap: 2,
  },
  segmentedTab: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  monthBoard: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },
  monthTile: {
    width: "25%",
    aspectRatio: 1.1,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCircle: {
    minWidth: 64,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  yearWheelFrame: {
    marginTop: 14,
    height: 220,
    position: "relative",
    overflow: "hidden",
  },
  yearWheelBand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 44,
    marginTop: -22,
    borderRadius: 14,
  },
  yearWheelItem: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  resetIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
