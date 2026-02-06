import { RemoveCircleHalfDotIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { createAnimatedComponent } from "react-native-reanimated";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

import { WeekPillWithOffset } from "./WeekPillWithOffset";

const AnimatedView = createAnimatedComponent(View);
const AnimatedScrollView = createAnimatedComponent(ScrollView);

export function ProgramTemplateEditorWeekSection(props: {
  visible: boolean;
  weeks: { index: number; label: string }[];
  selectedWeekIndex: number;
  draggingWeekIndex: number | null;
  weekDragFromIndexShared: any; // SharedValue<number>
  weekDropTargetIndexShared: any; // SharedValue<number>
  weekSlotWidth: number;
  weekPillColorByIndex: Record<number, string>;
  weekSectionRef: React.RefObject<View | null>;
  weekScrollMeasureRef: React.RefObject<View | null>;
  weekScrollRef: any;
  weekCarouselStyle: any;
  compactSectionStyle: any;
  onScrollMeasureLayout: (e: any) => void;
  onScroll: (e: any) => void;
  onContentSizeChange: (w: number, h: number) => void;
  onWeekPillLayout: (
    index: number,
    layout: { x: number; width: number }
  ) => void;
  onPressWeek: (index: number) => void;
  onLongPressWeek: (index: number, nativeEvent: any) => void;
  onRemoveWeek: () => void;
  onAddWeek: () => void;
  canRemove: boolean;
  canAdd: boolean;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  if (!props.visible) return null;

  return (
    <AnimatedView
      ref={props.weekSectionRef}
      collapsable={false}
      style={[
        props.compactSectionStyle,
        { borderBottomColor: theme.colors.border },
        props.weekCarouselStyle,
      ]}
    >
      <View style={styles.labelRow}>
        <Icon
          name="calendar-03"
          size={16}
          color={theme.colors.textMuted}
          strokeWidth={1.5}
        />
        <Text
          weight="semibold"
          style={[styles.label, { color: theme.colors.textMuted }]}
        >
          {t("library.programsScreen.weeksSection", "Weeks")}
        </Text>
      </View>

      <View style={styles.tabRow}>
        <View
          ref={props.weekScrollMeasureRef}
          collapsable={false}
          style={styles.scrollMeasure}
          onLayout={props.onScrollMeasureLayout}
        >
          <AnimatedScrollView
            ref={props.weekScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={props.draggingWeekIndex == null}
            scrollEventThrottle={16}
            onScroll={props.onScroll}
            onContentSizeChange={props.onContentSizeChange}
          >
            {props.weeks.map((w, i) => {
              const isSelected = props.selectedWeekIndex === i;
              return (
                <WeekPillWithOffset
                  key={w.index}
                  index={i}
                  fromIndexShared={props.weekDragFromIndexShared}
                  toIndexShared={props.weekDropTargetIndexShared}
                  slotWidth={props.weekSlotWidth}
                  onLayout={(ev) => {
                    const { x, width } = ev.nativeEvent.layout;
                    props.onWeekPillLayout(i, { x, width });
                  }}
                >
                  <Pressable
                    delayLongPress={500}
                    onLongPress={(e) =>
                      props.onLongPressWeek(i, (e as any).nativeEvent)
                    }
                    onPress={() => props.onPressWeek(i)}
                    style={({ pressed }) => [
                      styles.weekPill,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.accent
                          : props.weekPillColorByIndex[i] ?? "transparent",
                        borderColor: theme.colors.border,
                        opacity:
                          props.draggingWeekIndex === i ? 0 : pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekPillText,
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
          </AnimatedScrollView>
        </View>

        <View style={styles.controlsCol}>
          <Pressable
            onPress={props.onRemoveWeek}
            disabled={!props.canRemove}
            style={({ pressed }) => [
              styles.iconBtnTiny,
              { opacity: !props.canRemove ? 0.5 : pressed ? 0.8 : 1 },
            ]}
          >
            <HugeiconsIcon
              icon={RemoveCircleHalfDotIcon}
              size={14}
              color={theme.colors.text}
            />
          </Pressable>
          <Pressable
            onPress={props.onAddWeek}
            disabled={!props.canAdd}
            style={({ pressed }) => [
              styles.iconBtnTiny,
              { opacity: !props.canAdd ? 0.5 : pressed ? 0.8 : 1 },
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
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  label: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 0,
    marginTop: 0,
  },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 0 },
  scrollMeasure: { flex: 1, minWidth: 0 },
  scrollContent: { flexDirection: "row", gap: 4, paddingRight: 4 },
  weekPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  weekPillText: { fontSize: 11, fontWeight: "600" },
  controlsCol: { flexDirection: "column", gap: 1 },
  iconBtnTiny: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
