import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { fetchWorkoutsByTrainer } from "@/features/builder/api/workouts.api";
import { setPendingProgramDayAttachment } from "@/features/library/utils/programDayAttachmentBridge";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { Icon, Text, useTheme } from "@/shared/ui";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectWorkout: (workoutId: string, title: string) => void;
  /** When provided, "Create workout now" will set bridge and navigate to builder; after save, workout is attached to this day. */
  pendingDay?: { programId: string; weekIndex: number; dayIndex: number } | null;
};

export function ChooseFromWorkoutsSheet({
  visible,
  onClose,
  onSelectWorkout,
  pendingDay,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const trainerId = useAppSelector((s) => s.auth.userId ?? "");

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!trainerId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchWorkoutsByTrainer(trainerId);
      setRows(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load workouts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    if (visible) {
      setQuery("");
      fetchList();
    }
  }, [visible, fetchList]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((w) => (w.title ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  const handleSelect = (workout: WorkoutRow) => {
    onSelectWorkout(workout.id, workout.title ?? "Workout");
    onClose();
  };

  const handleCreateWorkout = () => {
    if (pendingDay) {
      setPendingProgramDayAttachment({
        programId: pendingDay.programId,
        weekIndex: pendingDay.weekIndex,
        dayIndex: pendingDay.dayIndex,
      });
    }
    onClose();
    router.push("/(trainer)/library/workout-builder/new" as Parameters<typeof router.push>[0]);
  };

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
              paddingBottom: insets.bottom + 24,
              maxHeight: "80%",
            },
          ]}
        >
          <View style={[styles.handleWrap]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text weight="bold" style={[styles.headerTitle, { color: theme.colors.text }]}>
              Choose workout
            </Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface3, borderColor: theme.colors.border }]}>
            <Icon name="search" size={18} color={theme.colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search workouts..."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Icon name="close" size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
          </View>

          {pendingDay && (
            <Pressable
              onPress={handleCreateWorkout}
              style={[styles.createRow, { borderBottomColor: theme.colors.border }]}
            >
              <Icon name="add-circle-outline" size={22} color={theme.colors.accent} strokeWidth={1.5} />
              <Text weight="semibold" style={{ color: theme.colors.accent }}>Create workout now</Text>
            </Pressable>
          )}

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={{ color: theme.colors.danger }}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: theme.colors.surface3, borderColor: theme.colors.border, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Text weight="semibold" style={{ color: theme.colors.text }} numberOfLines={1}>
                    {item.title || "Untitled workout"}
                  </Text>
                  <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ color: theme.colors.textMuted }}>No workouts found.</Text>
                </View>
              }
            />
          )}
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
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18 },
  closeBtn: { padding: 8 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  listContent: { padding: 16, paddingBottom: 24, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  empty: { padding: 24, alignItems: "center" },
});
