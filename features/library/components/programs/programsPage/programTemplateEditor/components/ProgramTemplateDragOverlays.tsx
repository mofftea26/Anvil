import React from "react";
import { StyleSheet, View } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";

import { Text } from "@/shared/ui";
import type { DraggingWorkoutState } from "../types";

const AnimatedView = createAnimatedComponent(View);

export function ProgramTemplateDragOverlays(props: {
  draggingWorkout: DraggingWorkoutState | null;
  draggingPhaseTitle: string | null;
  draggingWeekLabel: string | null;
  workoutOverlayStyle: any;
  phaseOverlayStyle: any;
  weekOverlayStyle: any;
  colors: {
    workoutBg: string;
    phaseBg: string;
    weekBg: string;
    border: string;
    background: string;
    text: string;
  };
}) {
  return (
    <>
      {props.draggingWorkout && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <AnimatedView
            style={[
              styles.workoutClone,
              { backgroundColor: props.colors.workoutBg },
              props.workoutOverlayStyle,
            ]}
          >
            <Text
              style={[styles.workoutText, { color: props.colors.text }]}
              numberOfLines={1}
            >
              {props.draggingWorkout.workoutTitle}
            </Text>
          </AnimatedView>
        </View>
      )}

      {props.draggingPhaseTitle && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <AnimatedView
            style={[
              styles.phaseClone,
              { backgroundColor: props.colors.phaseBg },
              props.phaseOverlayStyle,
            ]}
          >
            <Text
              style={[styles.phaseText, { color: props.colors.background }]}
              numberOfLines={1}
            >
              {props.draggingPhaseTitle}
            </Text>
          </AnimatedView>
        </View>
      )}

      {props.draggingWeekLabel && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <AnimatedView
            style={[
              styles.weekClone,
              {
                backgroundColor: props.colors.weekBg,
                borderColor: props.colors.border,
              },
              props.weekOverlayStyle,
            ]}
          >
            <Text
              style={[styles.phaseText, { color: props.colors.background }]}
              numberOfLines={1}
            >
              {props.draggingWeekLabel}
            </Text>
          </AnimatedView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  workoutClone: {
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
  workoutText: { fontSize: 12, fontWeight: "500", flexShrink: 1 },
  phaseClone: {
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
  weekClone: {
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
  phaseText: { fontSize: 11, fontWeight: "600" },
});
