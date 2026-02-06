import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

export function DurationPhasesField(props: {
  phaseCount: number;
  setPhaseCount: (updater: (p: number) => number) => void;
  durationWeeks: number;
  setDurationWeeks: (updater: (w: number) => number) => void;
  minPhases: number;
  maxPhases: number;
  minWeeks: number;
  maxWeeks: number;
  weeksPerPhase: number[];
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
        {t("library.createProgram.durationAndPhases", "Phases & duration")}
      </Text>

      <View style={styles.stepperRowWrap}>
        <View style={styles.stepperBlock}>
          <View style={styles.stepperLabelRow}>
            <Icon
              name="cells"
              size={14}
              color={theme.colors.textMuted}
              strokeWidth={1.5}
            />
            <Text
              style={[
                styles.stepperSubLabel,
                { color: theme.colors.textMuted },
              ]}
            >
              {t("library.createProgram.phases", "Phases")}
            </Text>
          </View>

          <View
            style={[
              styles.stepperRow,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Pressable
              onPress={() =>
                props.setPhaseCount((p) => Math.max(props.minPhases, p - 1))
              }
              style={styles.stepperBtn}
              disabled={props.phaseCount <= props.minPhases}
            >
              <Icon
                name="remove"
                size={20}
                color={
                  props.phaseCount <= props.minPhases
                    ? theme.colors.textMuted
                    : theme.colors.text
                }
              />
            </Pressable>
            <Text style={[styles.stepperValue, { color: theme.colors.text }]}>
              {props.phaseCount}
            </Text>
            <Pressable
              onPress={() =>
                props.setPhaseCount((p) => Math.min(props.maxPhases, p + 1))
              }
              style={styles.stepperBtn}
              disabled={props.phaseCount >= props.maxPhases}
            >
              <Icon
                name="add"
                size={20}
                color={
                  props.phaseCount >= props.maxPhases
                    ? theme.colors.textMuted
                    : theme.colors.text
                }
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.stepperBlock}>
          <View style={styles.stepperLabelRow}>
            <Icon
              name="calendar-03"
              size={14}
              color={theme.colors.textMuted}
              strokeWidth={1.5}
            />
            <Text
              style={[
                styles.stepperSubLabel,
                { color: theme.colors.textMuted },
              ]}
            >
              {t("library.createProgram.weeks", "Weeks")}
            </Text>
          </View>

          <View
            style={[
              styles.stepperRow,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Pressable
              onPress={() =>
                props.setDurationWeeks((w) => Math.max(props.minWeeks, w - 1))
              }
              style={styles.stepperBtn}
              disabled={props.durationWeeks <= props.minWeeks}
            >
              <Icon
                name="remove"
                size={20}
                color={
                  props.durationWeeks <= props.minWeeks
                    ? theme.colors.textMuted
                    : theme.colors.text
                }
              />
            </Pressable>
            <Text style={[styles.stepperValue, { color: theme.colors.text }]}>
              {props.durationWeeks}
            </Text>
            <Pressable
              onPress={() =>
                props.setDurationWeeks((w) => Math.min(props.maxWeeks, w + 1))
              }
              style={styles.stepperBtn}
              disabled={props.durationWeeks >= props.maxWeeks}
            >
              <Icon
                name="add"
                size={20}
                color={
                  props.durationWeeks >= props.maxWeeks
                    ? theme.colors.textMuted
                    : theme.colors.text
                }
              />
            </Pressable>
          </View>
        </View>
      </View>

      <Text
        style={[
          styles.phaseBreakdown,
          { color: theme.colors.textMuted, marginTop: 10 },
        ]}
        numberOfLines={2}
      >
        {props.weeksPerPhase
          .map((wks, i) =>
            t("library.createProgram.phaseWeeks", "Phase {{n}} ({{w}} wks)", {
              n: i + 1,
              w: wks,
            })
          )
          .join(" · ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  stepperRowWrap: { flexDirection: "row", gap: 12 },
  stepperBlock: { flex: 1, gap: 8 },
  stepperLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepperSubLabel: { fontSize: 12, fontWeight: "600" },
  stepperRow: {
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { fontSize: 16, fontWeight: "700" },
  phaseBreakdown: { fontSize: 12, lineHeight: 18 },
});
