import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { useSetTypesDictionary } from "@/features/library/hooks/useSetTypesDictionary";
import type { SetTypeRow } from "@/features/library/types/setTypes";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, StickyHeader, Text, useTheme } from "@/shared/ui";

import { useFocusEffect } from "@react-navigation/native";
import { AddSeriesCard, SeriesPage } from "../components/SeriesPage";
import { SetsEditorSheet } from "../components/SetsEditorSheet";
import { StickySaveBar } from "../components/StickySaveBar";
import { MOCK_LIBRARY_EXERCISES } from "../data/mockLibraryExercises";
import { useWorkoutEditor } from "../hooks/useWorkoutEditor";
import type { SeriesExercise, WorkoutSeries } from "../types";
import { consumePendingExercisePick } from "../utils/exercisePickerBridge";
import { getNextSeriesLabel } from "../utils/seriesLabel";

type Props = {
  mode: "new" | "edit";
};

type CarouselItem =
  | { kind: "series"; id: string }
  | { kind: "addSeries"; id: "addSeries" };

function createEmptySeriesState(): WorkoutSeries[] {
  return [
    {
      id: cryptoRandomId(),
      label: "A",
      exercises: [],
    },
  ];
}

export function WorkoutBuilderScreen({ mode }: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const routeParams = useLocalSearchParams<{
    workoutId?: string;
  }>();

  const workoutId = typeof routeParams.workoutId === "string" ? routeParams.workoutId : null;

  const initialSeriesRef = useRef<WorkoutSeries[]>(createEmptySeriesState());

  const {
    series,
    setSeries,
    isLoading,
    isSaving,
    error,
    save,
    discardToLastSaved,
  } = useWorkoutEditor({
    mode,
    workoutId,
    initialSeries: initialSeriesRef.current,
  });

  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0);

  const [editingExercise, setEditingExercise] = useState<{
    seriesId: string;
    exerciseId: string;
  } | null>(null);

  const { rows: setTypesRows = [] } = useSetTypesDictionary();

  const flatRef = useRef<FlatList<CarouselItem>>(null);

  const items: CarouselItem[] = useMemo(() => {
    return [
      ...series.map((s) => ({ kind: "series", id: s.id } as const)),
      { kind: "addSeries", id: "addSeries" as const },
    ];
  }, [series]);

  useFocusEffect(
    React.useCallback(() => {
      const pending = consumePendingExercisePick();
      if (!pending) return;

      const pickById = (id: string) => MOCK_LIBRARY_EXERCISES.find((x) => x.id === id) ?? null;
      const picked = pending.exerciseIds
        .map((id) => pickById(id))
        .filter(Boolean)
        .map((x) => ({
          id: cryptoRandomId(),
          title: x!.title,
          videoUrl: x!.videoUrl ?? null,
          notes: null,
          tempo: { eccentric: "3", bottom: "0", concentric: "1", top: "0" },
          sets: [],
          trainerNotes: null,
        }));

      if (!picked.length) return;

      setSeries((prev) => {
        const hasTarget = prev.some((s) => s.id === pending.targetSeriesId);
        const targetId = hasTarget ? pending.targetSeriesId : prev[0]?.id ?? null;
        if (!targetId) return prev;

        return prev.map((s) =>
          s.id !== targetId ? s : { ...s, exercises: [...s.exercises, ...picked] }
        );
      });
    }, [setSeries])
  );

  function onAddSeries() {
    setSeries((prev) => {
      const nextLabel = getNextSeriesLabel(prev.map((x) => x.label));
      return [
        ...prev,
        {
          id: cryptoRandomId(),
          label: nextLabel,
          exercises: [],
        },
      ];
    });

    requestAnimationFrame(() => {
      flatRef.current?.scrollToIndex({
        index: series.length,
        animated: true,
      });
    });
  }
  function onAddExercise(seriesId: string) {
    router.push({
      pathname: "/(trainer)/library/workout-builder/exercise-picker",
      params: { targetSeriesId: seriesId },
    });
  }
  

  function onEditExercise(seriesId: string, exerciseId: string) {
    setEditingExercise({ seriesId, exerciseId });
  }

  const editingData = useMemo(() => {
    if (!editingExercise) return null;
    const s = series.find((x) => x.id === editingExercise.seriesId);
    const ex = s?.exercises.find((x) => x.id === editingExercise.exerciseId);
    if (!s || !ex) return null;
    return { seriesId: s.id, exercise: ex };
  }, [editingExercise, series]);

  function onUpdateExercise(updated: SeriesExercise) {
    if (!editingData) return;

    setSeries((prev) =>
      prev.map((s) => {
        if (s.id !== editingData.seriesId) return s;
        return {
          ...s,
          exercises: s.exercises.map((e) =>
            e.id === updated.id ? updated : e
          ),
        };
      })
    );
  }

  function discardChanges() {
    discardToLastSaved();
    setActiveSeriesIndex(0);
    requestAnimationFrame(() => {
      flatRef.current?.scrollToIndex({ index: 0, animated: true });
    });
  }

  async function saveChanges() {
    const res = await save();
    if (!res) {
      appToast.error(error ?? t("auth.errors.generic"));
      return;
    }

    appToast.success(
      mode === "new"
        ? t("builder.toasts.workoutPublished")
        : t("builder.toasts.workoutUpdated")
    );
    router.back();
  }

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <StickyHeader title={t("builder.workoutBuilder.title")} showBackButton />
        <View style={styles.center}>
          <ActivityIndicator />
          <View style={{ height: 10 }} />
          <Text style={{ opacity: 0.7 }}>
            {t("builder.workoutBuilder.loadingDraft")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader
        title={t("builder.workoutBuilder.title")}
        showBackButton
       
      />

      {error ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
          <Text style={{ color: "rgba(255,100,100,0.95)", fontWeight: "900" }}>
            {error}
          </Text>
        </View>
      ) : null}

      <FlatList
        ref={flatRef}
        horizontal
        pagingEnabled
        data={items}
        keyExtractor={(it) => it.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 130,
          paddingTop: 10,
        }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveSeriesIndex(Math.min(idx, Math.max(0, series.length - 1)));
        }}
        renderItem={({ item }) => {
          if (item.kind === "addSeries") {
            return (
              <View style={{ width, paddingHorizontal: 14 }}>
                <AddSeriesCard onPress={onAddSeries} />
              </View>
            );
          }

          const s = series.find((x) => x.id === item.id);
          if (!s) return <View style={{ width }} />;

          return (
            <View style={{ width, paddingHorizontal: 14 }}>
              <SeriesPage
                series={s}
                onEditExercise={(exerciseId) => onEditExercise(s.id, exerciseId)}
                onAddExercise={onAddExercise}
              />
            </View>
          );
        }}
      />

      <StickySaveBar
        onSave={saveChanges}
        onDiscard={discardChanges}
        isSaving={isSaving}
      />

      <SetsEditorSheet
        visible={Boolean(editingData)}
        exercise={editingData?.exercise ?? null}
        setTypes={setTypesRows as unknown as SetTypeRow[]}
        onClose={() => setEditingExercise(null)}
        onChange={onUpdateExercise}
      />
    </View>
  );
}

function cryptoRandomId() {
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
