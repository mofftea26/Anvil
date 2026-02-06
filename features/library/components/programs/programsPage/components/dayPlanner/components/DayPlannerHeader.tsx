import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text } from "@/shared/ui";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function DayPlannerHeader(props: {
  weekIndex: number;
  dayLabel: string;
  hasWorkouts: boolean;
  count: number;
  palette: {
    headerGradientStart: string;
    headerGradientMid: string;
    headerGradientEnd: string;
    headerBorder: string;
    title: string;
    subtitle: string;
    addBtnIcon: string;
  };
  onAddWorkout: () => void;
}) {
  const { t } = useAppTranslation();
  const { palette } = props;

  return (
    <View style={styles.header}>
      <LinearGradient
        colors={[
          palette.headerGradientStart,
          palette.headerGradientMid,
          palette.headerGradientEnd,
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.headerContent, { paddingHorizontal: 20 }]}>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Icon
              name="calendar-03"
              size={18}
              color={palette.title}
              strokeWidth={1.5}
            />
            <Text
              weight="bold"
              style={[styles.headerTitle, { color: palette.title }]}
            >
              {t(
                "library.programsScreen.weekDayHeader",
                "Week {{week}} · {{day}}",
                {
                  week: props.weekIndex + 1,
                  day: props.dayLabel,
                }
              )}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: palette.subtitle }]}>
            {props.hasWorkouts
              ? t("library.programsScreen.workoutCount", { count: props.count })
              : t(
                  "library.programsScreen.noWorkoutsThisDay",
                  "No workouts this day"
                )}
          </Text>
        </View>

        <Pressable
          onPress={props.onAddWorkout}
          style={({ pressed }) => [
            styles.addBtn,
            {
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Icon
            name="add-circle-outline"
            size={26}
            color={palette.addBtnIcon}
          />
        </Pressable>
      </View>
      <View
        style={[styles.headerBorder, { backgroundColor: palette.headerBorder }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
});
