import { RemoveCircleHalfDotIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { createAnimatedComponent } from "react-native-reanimated";

import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

import { PhaseTabWithOffset } from "./PhaseTabWithOffset";

const AnimatedView = createAnimatedComponent(View);
const AnimatedScrollView = createAnimatedComponent(ScrollView);

export function ProgramTemplateEditorPhaseSection(props: {
  visible: boolean;
  phases: { title: string }[];
  selectedPhaseIndex: number;
  draggingPhaseIndex: number | null;
  phaseDragFromIndexShared: any; // SharedValue<number>
  phaseDropTargetIndexShared: any; // SharedValue<number>
  phaseSlotWidth: number;
  phaseSectionRef: React.RefObject<View | null>;
  phaseScrollMeasureRef: React.RefObject<View | null>;
  phaseScrollRef: any;
  phaseCarouselStyle: any;
  compactSectionStyle: any;
  onScrollMeasureLayout: (e: any) => void;
  onScroll: (e: any) => void;
  onContentSizeChange: (w: number, h: number) => void;
  onPhaseTabLayout: (
    index: number,
    layout: { x: number; width: number }
  ) => void;
  onPressPhase: (index: number) => void;
  onLongPressPhase: (index: number, nativeEvent: any) => void;
  onRemovePhase: () => void;
  onAddPhase: () => void;
  canRemove: boolean;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  if (!props.visible) return null;

  return (
    <AnimatedView
      ref={props.phaseSectionRef}
      collapsable={false}
      style={[
        props.compactSectionStyle,
        { borderBottomColor: theme.colors.border },
        props.phaseCarouselStyle,
      ]}
    >
      <View style={styles.labelRow}>
        <Icon
          name="cells"
          size={16}
          color={theme.colors.textMuted}
          strokeWidth={1.5}
        />
        <Text
          weight="semibold"
          style={[styles.label, { color: theme.colors.textMuted }]}
        >
          {t("library.programsScreen.phase", "Phase")}
        </Text>
      </View>

      <View style={styles.tabRow}>
        <View
          ref={props.phaseScrollMeasureRef}
          collapsable={false}
          style={styles.scrollMeasure}
          onLayout={props.onScrollMeasureLayout}
        >
          <AnimatedScrollView
            ref={props.phaseScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={props.draggingPhaseIndex == null}
            scrollEventThrottle={16}
            onScroll={props.onScroll}
            onContentSizeChange={props.onContentSizeChange}
          >
            {props.phases.map((phase, i) => {
              const isSelected = props.selectedPhaseIndex === i;
              return (
                <PhaseTabWithOffset
                  key={`phase-${i}`}
                  index={i}
                  fromIndexShared={props.phaseDragFromIndexShared}
                  toIndexShared={props.phaseDropTargetIndexShared}
                  slotWidth={props.phaseSlotWidth}
                  onLayout={(ev) => {
                    const { x, width } = ev.nativeEvent.layout;
                    props.onPhaseTabLayout(i, { x, width });
                  }}
                >
                  <Pressable
                    delayLongPress={500}
                    onLongPress={(e) =>
                      props.onLongPressPhase(i, (e as any).nativeEvent)
                    }
                    onPress={() => props.onPressPhase(i)}
                    style={({ pressed }) => [
                      styles.phaseTab,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.accent
                          : hexToRgba(theme.colors.text, 0.06),
                        opacity:
                          props.draggingPhaseIndex === i
                            ? 0
                            : pressed
                            ? 0.9
                            : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.phaseTabText,
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
          </AnimatedScrollView>
        </View>

        <View style={styles.controlsCol}>
          <Pressable
            onPress={props.onRemovePhase}
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
            onPress={props.onAddPhase}
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
  phaseTab: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  phaseTabText: { fontSize: 11, fontWeight: "600" },
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
