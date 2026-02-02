import type { DayWorkoutRef } from "@/features/library/types/programTemplate";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutById } from "@/features/builder/api/workouts.api";
import type {
  ProgramDay,
  ProgramTemplateState,
} from "@/features/library/types/programTemplate";
import { WorkoutCard } from "@/features/library/components/workouts/WorkoutCard";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Icon, Text, useTheme } from "@/shared/ui";

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
  const insets = useSafeAreaInsets();
  const [resolvedRows, setResolvedRows] = useState<(WorkoutRow | null)[]>([]);

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
    const initial = list.map((ref) => refToWorkoutRow(ref, workoutRowsMap, inline));
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
  }, [visible, day?.id, count, state?.workoutLibrary?.inlineWorkouts, workoutRowsMap, day]);

  const hasWorkouts = count > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.backdrop, { paddingTop: insets.top }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
              paddingBottom: insets.bottom + 80,
            },
          ]}
        >
          <View style={[styles.handleWrap]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text weight="bold" style={[styles.headerTitle, { color: theme.colors.text }]}>
                {t("library.programsScreen.weekDayHeader", "Week {{week}} · {{day}}", {
                  week: weekIndex + 1,
                  day: dayLabel,
                })}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                {hasWorkouts
                  ? t("library.programsScreen.workoutCount", { count })
                  : t("library.programsScreen.noWorkoutsThisDay", "No workouts this day")}
              </Text>
            </View>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!hasWorkouts ? (
              <View style={[styles.empty, { paddingVertical: theme.spacing.xl }]}>
                <Text style={{ color: theme.colors.textMuted }}>
                  {t("library.programsScreen.noWorkoutsThisDay", "No workouts this day")}.
                </Text>
                <Button variant="secondary" onPress={onAddWorkout} style={{ marginTop: theme.spacing.md }}>
                  + {t("library.programsScreen.addWorkoutDay", "Add workout")}
                </Button>
              </View>
            ) : (
              <View style={{ gap: theme.spacing.md }}>
                {refs.map((ref, index) => {
                  const row = resolvedRows[index];
                  const tableId = ref?.source === "workoutsTable" ? ref.workoutId : null;
                  return (
                    <View key={index} style={styles.cardRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        {row ? (
                          <WorkoutCard
                            workout={row}
                            updatedAtLabel={t("library.workoutsList.updatedAt")}
                            defaultTitle={t("builder.workoutDetails.defaultTitle", "Untitled workout")}
                            onPress={() => {
                              if (tableId) {
                                onClose();
                                router.push(
                                  `/(trainer)/library/workout-builder/${tableId}` as Parameters<typeof router.push>[0]
                                );
                              }
                            }}
                          />
                        ) : (
                          <View style={[styles.cardPlaceholder, { backgroundColor: theme.colors.surface3 }]}>
                            <ActivityIndicator size="small" color={theme.colors.accent} />
                            <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>Loading…</Text>
                          </View>
                        )}
                      </View>
                      <Pressable
                        onPress={() => onRemoveWorkoutAt(index)}
                        style={({ pressed }) => [
                          styles.removeBtn,
                          { backgroundColor: theme.colors.surface3, opacity: pressed ? 0.8 : 1 },
                        ]}
                      >
                        <Icon name="remove" size={20} color={theme.colors.danger} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <Button onPress={onAddWorkout}>
              + {t("library.programsScreen.addWorkoutDay", "Add workout")}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: "85%",
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  empty: { alignItems: "center" },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardPlaceholder: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
