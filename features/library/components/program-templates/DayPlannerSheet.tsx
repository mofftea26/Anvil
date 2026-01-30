import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DayWorkout } from "@/features/library/types/programTemplate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Icon, Text, useTheme } from "@/shared/ui";

type Props = {
  visible: boolean;
  weekIndex: number;
  dayIndex: number;
  workouts: DayWorkout[];
  onClose: () => void;
  onAddWorkout: () => void;
  onRemoveWorkout: (index: number) => void;
  onReplaceWorkout?: (index: number) => void;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DayPlannerSheet({
  visible,
  weekIndex,
  dayIndex,
  workouts,
  onClose,
  onAddWorkout,
  onRemoveWorkout,
  onReplaceWorkout,
}: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [menuIndex, setMenuIndex] = useState<number | null>(null);

  const dayLabel = dayIndex >= 1 && dayIndex <= 7 ? DAY_LABELS[dayIndex - 1] : `Day ${dayIndex}`;

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
                Week {weekIndex} · {dayLabel}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
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
            {workouts.length === 0 ? (
              <View style={[styles.empty, { paddingVertical: theme.spacing.xl }]}>
                <Text style={{ color: theme.colors.textMuted }}>No workouts this day.</Text>
                <Button variant="secondary" onPress={onAddWorkout} style={{ marginTop: theme.spacing.md }}>
                  + Add workout
                </Button>
              </View>
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {workouts.map((w, i) => (
                  <View
                    key={`${w.workoutId}-${i}`}
                    style={[
                      styles.row,
                      {
                        backgroundColor: theme.colors.surface3,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text weight="semibold" style={{ color: theme.colors.text }} numberOfLines={1}>
                        {w.title ?? "Workout"}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setMenuIndex(menuIndex === i ? null : i)}
                      style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Icon name="ellipsis-vertical" size={18} color={theme.colors.textMuted} />
                    </Pressable>
                    {menuIndex === i && (
                      <View style={[styles.menuPop, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
                        {onReplaceWorkout && (
                          <Pressable
                            onPress={() => {
                              setMenuIndex(null);
                              onReplaceWorkout(i);
                            }}
                            style={styles.menuItem}
                          >
                            <Text style={{ color: theme.colors.text }}>Replace</Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => {
                            setMenuIndex(null);
                            onRemoveWorkout(i);
                          }}
                          style={styles.menuItem}
                        >
                          <Text style={{ color: theme.colors.danger }}>Remove</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
                <Button variant="secondary" onPress={onAddWorkout}>
                  + Add workout
                </Button>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <Button onPress={onAddWorkout}>+ Add workout</Button>
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
  handleWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    position: "relative",
  },
  menuBtn: { padding: 8 },
  menuPop: {
    position: "absolute",
    right: 8,
    top: 44,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 120,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
