import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { fetchExercises } from "@/shared/api/exercises.api";
import type { Exercise } from "@/shared/types/exercise";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { formatSlugToLabel } from "@/shared/utils";
import { Chip, ExerciseLibraryCard, Icon, StickyHeader, Text, useTheme } from "@/shared/ui";

function getUniqueMuscles(exercises: Exercise[]): string[] {
  const set = new Set<string>();
  for (const ex of exercises) {
    for (const m of ex.targetMuscles ?? []) {
      if (m?.trim()) set.add(m.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function ExercisesScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const [query, setQuery] = useState("");
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
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Failed to load exercises");
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

  function onCardPress(exerciseId: string) {
    router.push({
      pathname: "/(trainer)/library/workout-builder/exercise/[exerciseId]",
      params: { exerciseId },
    });
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader
        title={t("library.exercisesScreen.title", "Exercise library")}
        showBackButton
      />

      {/* Search – same layout as picker but no selection count */}
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
            placeholder={t("library.exercisesScreen.searchPlaceholder", "Search exercises...")}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} style={styles.clearBtn} hitSlop={8}>
              <Icon name="close" size={18} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Target muscle filter */}
      {allMuscles.length > 0 && (
        <View style={[styles.filterRow, { borderBottomColor: theme.colors.border }]}>
          <Text
            style={[styles.filterLabel, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {t("library.exercisesScreen.filterByMuscle", "Target muscle")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {allMuscles.map((muscle) => (
              <Chip
                key={muscle}
                label={formatSlugToLabel(muscle)}
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
            <ExerciseLibraryCard
              exercise={item}
              isBuilder={false}
              onCardPress={() => onCardPress(item.id)}
            />
          )}
        />
      )}
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
    paddingBottom: 24,
  },
  separator: {
    height: 10,
  },
});
