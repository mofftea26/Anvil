import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { WorkoutCard } from "@/features/library/components/workouts/WorkoutCard";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

export function DayPlannerWorkoutList(props: {
  refs: any[];
  resolvedRows: (WorkoutRow | null)[];
  onOpenWorkout: (workoutId: string) => void;
  onRemoveAt: (index: number) => void;
  palette: {
    cardPlaceholderBg: string;
    swipeActionGradientStart: string;
    swipeActionGradientEnd: string;
    swipeActionText: string;
  };
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const renderRightActionsForIndex = useCallback(
    (index: number) => {
      function SwipeableRightActions() {
        return (
          <View style={styles.rightActionWrap}>
            <RectButton
              style={styles.rightAction}
              onPress={() => props.onRemoveAt(index)}
            >
              <View style={styles.rightActionInner}>
                <LinearGradient
                  colors={[
                    props.palette.swipeActionGradientStart,
                    props.palette.swipeActionGradientEnd,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Icon
                  name="trash"
                  size={22}
                  color={props.palette.swipeActionText}
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
      props,
      t,
      props.palette.swipeActionGradientStart,
      props.palette.swipeActionGradientEnd,
      props.palette.swipeActionText,
    ]
  );

  return (
    <View style={styles.cardList}>
      {props.refs.map((ref, index) => {
        const row = props.resolvedRows[index];
        const tableId = ref?.source === "workoutsTable" ? ref.workoutId : null;
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
                  updatedAtLabel={t("library.workoutsList.updatedAt")}
                  defaultTitle={t(
                    "builder.workoutDetails.defaultTitle",
                    "Untitled workout"
                  )}
                  onPress={() => {
                    if (tableId) props.onOpenWorkout(tableId);
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.cardPlaceholder,
                    { backgroundColor: props.palette.cardPlaceholderBg },
                  ]}
                >
                  <ActivityIndicator size="small" color={theme.colors.accent} />
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
  );
}

const styles = StyleSheet.create({
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
