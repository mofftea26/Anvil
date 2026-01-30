import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { fetchExercises } from "../api/exercises.api";
import { ExercisePickerCard } from "../components/ExercisePickerCard";
import { StickySaveBar } from "../components/StickySaveBar";
import type { Exercise } from "../types/exercise";
import { setPendingExercisePick } from "../utils/exercisePickerBridge";

import { Chip, Icon, StickyHeader, Text, useTheme } from "@/shared/ui";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

function getUniqueMuscles(exercises: Exercise[]): string[] {
  const set = new Set<string>();
  for (const ex of exercises) {
    for (const m of ex.targetMuscles ?? []) {
      if (m?.trim()) set.add(m.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function ExercisePickerScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const params = useLocalSearchParams<{
    targetSeriesId?: string;
  }>();

  const targetSeriesId = params.targetSeriesId ?? null;

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allMuscles, setAllMuscles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchList = useCallback(async (search: string, muscles: string[]) => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await fetchExercises({
        search: search.trim() || undefined,
        isArchived: false,
        targetMuscles: muscles.length > 0 ? muscles : undefined,
      });
      setExercises(list);
      if (muscles.length === 0) {
        setAllMuscles((prev) => {
          const next = getUniqueMuscles(list);
          return next.length > 0 ? next : prev;
        });
      }
    } catch (e: any) {
      setFetchError(e?.message ?? "Failed to load exercises");
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchList(query, selectedMuscles);
  }, [query, selectedMuscles, fetchList]);

  function toggleMuscle(muscle: string) {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  }

  const selectedIds = useMemo(() => {
    return Object.keys(selected).filter((id) => selected[id]);
  }, [selected]);

  const selectedExercises = useMemo(() => {
    return exercises.filter((ex) => selected[ex.id]);
  }, [exercises, selected]);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function onCardPress(exerciseId: string) {
    router.push({
      pathname: "/(trainer)/library/workout-builder/exercise/[exerciseId]",
      params: { exerciseId },
    });
  }

  function onCancel() {
    router.back();
  }

  function onConfirm() {
    if (!targetSeriesId) {
      router.back();
      return;
    }

    if (!selectedIds.length) {
      router.back();
      return;
    }

    setPendingExercisePick({
      token: Date.now().toString(),
      targetSeriesId,
      exerciseIds: selectedIds,
      exercises: selectedExercises.map((ex) => ({
        id: ex.id,
        title: ex.title,
        videoUrl: ex.videoUrl ?? null,
      })),
    });

    router.back();
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader title={t("builder.exercisePicker.title")} showBackButton />

      {/* Search + selection count on same line */}
      <View style={[styles.toolbar, { borderBottomColor: theme.colors.border }]}>
        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="search" size={18} color={theme.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("builder.exercisePicker.searchPlaceholder")}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              style={styles.clearBtn}
              hitSlop={8}
            >
              <Icon name="close" size={18} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            styles.countPill,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="checkmark-circle" size={18} color={theme.colors.accent} />
          <Text weight="bold" style={{ color: theme.colors.text, fontSize: 14 }}>
            {selectedIds.length}
          </Text>
        </View>
      </View>

      {/* Target muscle filter – multiple selection */}
      {allMuscles.length > 0 && (
        <View style={[styles.filterRow, { borderBottomColor: theme.colors.border }]}>
          <Text
            style={[styles.filterLabel, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {t("builder.exercisePicker.filterByMuscle", "Target muscle")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {allMuscles.map((muscle) => (
              <Chip
                key={muscle}
                label={muscle}
                isActive={selectedMuscles.includes(muscle)}
                onPress={() => toggleMuscle(muscle)}
                style={styles.chip}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={[styles.centered, { paddingVertical: 48 }]}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : fetchError ? (
        <View style={[styles.centered, { padding: 24 }]}>
          <Text style={{ color: theme.colors.textMuted }}>{fetchError}</Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ExercisePickerCard
              exercise={item}
              selected={Boolean(selected[item.id])}
              onCardPress={() => onCardPress(item.id)}
              onAddPress={() => toggle(item.id)}
            />
          )}
        />
      )}

      <StickySaveBar onSave={onConfirm} onDiscard={onCancel} isSaving={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  chipScroll: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 14,
  },
  chip: {
    marginRight: 0,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 14,
    paddingBottom: 120,
  },
  separator: {
    height: 10,
  },
});
