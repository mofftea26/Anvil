import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";

import { useSetTypesDictionary } from "@/src/features/library/hooks/useSetTypesDictionary";
import type { SetTypeRow } from "@/src/features/library/types/setTypes";
import { StickyHeader, Text, useTheme } from "@/src/shared/ui";

import { useFocusEffect } from "@react-navigation/native";
import { AddSeriesCard, SeriesPage } from "../components/SeriesPage";
import { SetsEditorSheet } from "../components/SetsEditorSheet";
import { StickySaveBar } from "../components/StickySaveBar";
import { MOCK_LIBRARY_EXERCISES } from "../data/mockLibraryExercises";
import { usePublishWorkoutDraft } from "../hooks/usePublishWorkoutDraft";
import { useWorkoutDraft } from "../hooks/useWorkoutDraft";
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
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const routeParams = useLocalSearchParams<{
    draftId?: string;
    addExerciseIds?: string;
    targetSeriesId?: string;
    addToken?: string;
  }>();

  const paramDraftId = routeParams.draftId ?? null;

  const initialSeriesRef = useRef<WorkoutSeries[]>(createEmptySeriesState());

  const {
    series,
    setSeries,
    resolvedDraftId,
    isLoading,
    isSaving,
    error,
    saveDraft,
    discardToLastSaved,
  } = useWorkoutDraft({
    initialSeries: initialSeriesRef.current,
    draftId: mode === "edit" ? paramDraftId : null,
  });

  const { publish, isPublishing, publishError } = usePublishWorkoutDraft();

  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0);

  const [editingExercise, setEditingExercise] = useState<{
    seriesId: string;
    exerciseId: string;
  } | null>(null);

  const { rows: setTypesRows = [] } = useSetTypesDictionary();

  const flatRef = useRef<FlatList<CarouselItem>>(null);
  const lastAppliedTokenRef = useRef<string | null>(null);

  const items: CarouselItem[] = useMemo(() => {
    return [
      ...series.map((s) => ({ kind: "series", id: s.id } as const)),
      { kind: "addSeries", id: "addSeries" as const },
    ];
  }, [series]);

  const canPublish = useMemo(() => {
    const totalExercises = series.reduce((acc, s) => acc + s.exercises.length, 0);
    return Boolean(resolvedDraftId) && totalExercises > 0 && !isSaving && !isPublishing;
  }, [resolvedDraftId, series, isSaving, isPublishing]);
  useFocusEffect(
    React.useCallback(() => {
      const pending = consumePendingExercisePick();
      if (!pending) return;
  
      setSeries((prev) =>
        prev.map((s) => {
          if (s.id !== pending.targetSeriesId) return s;
  
          const picked = pending.exerciseIds
            .map((id) => MOCK_LIBRARY_EXERCISE_BY_ID(id))
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
  
          return { ...s, exercises: [...s.exercises, ...picked] };
        })
      );
    }, [setSeries])
  );
  
  // ✅ Apply selected exercises returned from picker
  React.useEffect(() => {
    const token = routeParams.addToken ?? null;
    const ids = (routeParams.addExerciseIds ?? "").trim();
    const targetSeriesId = routeParams.targetSeriesId ?? null;

    if (!token || !ids || !targetSeriesId) return;
    if (lastAppliedTokenRef.current === token) return;

    lastAppliedTokenRef.current = token;

    const idList = ids
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (!idList.length) return;

    const picked = idList
      .map((id) => MOCK_LIBRARY_EXERCISE_BY_ID(id))
      .filter(Boolean)
      .map((x) => ({
        id: cryptoRandomId(),
        title: x!.title,
        videoUrl: x!.videoUrl ?? null,
        notes: null,
        tempo: { eccentric: "3", bottom: "0", concentric: "1", top: "0" },
        sets: [],
        trainerNotes: null,
      })) as SeriesExercise[];

    setSeries((prev) =>
      prev.map((s) =>
        s.id !== targetSeriesId
          ? s
          : { ...s, exercises: [...s.exercises, ...picked] }
      )
    );
  }, [
    routeParams.addToken,
    routeParams.addExerciseIds,
    routeParams.targetSeriesId,
    setSeries,
  ]);

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
    const res = await saveDraft();
    if (!res) return;

    if (mode === "new") {
      router.replace({
        pathname: `/(trainer)/library/workout-builder/${res.draftId}` as any,
        params: { draftId: res.draftId },
      } as any);
    }
  }

  async function onPublish() {
    if (!resolvedDraftId) return;

    // ensure latest draft exists before publishing
    await saveDraft();

    const workoutId = await publish(resolvedDraftId, null);
    if (!workoutId) return;

    router.push({
      pathname: `/(trainer)/library/workouts/${workoutId}` as any,
      params: { workoutId },
    } as any);
  }

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <StickyHeader title="Workout Builder" showBackButton />
        <View style={styles.center}>
          <ActivityIndicator />
          <View style={{ height: 10 }} />
          <Text style={{ opacity: 0.7 }}>Loading draft...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader
        title="Workout Builder"
        showBackButton
        rightButton={
          resolvedDraftId
            ? {
                label: isPublishing ? "Publishing..." : "Publish",
                variant: "secondary",
                isLoading: isPublishing,
                onPress: onPublish,
                icon: (
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={theme.colors.text}
                  />
                ),
              }
            : undefined
        }
      />

      {(error || publishError) ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
          <Text style={{ color: "rgba(255,100,100,0.95)", fontWeight: "900" }}>
            {error ?? publishError}
          </Text>
        </View>
      ) : null}

      {!canPublish && resolvedDraftId ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
          <Text style={{ opacity: 0.6 }}>
            Add at least 1 exercise to publish.
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

function MOCK_LIBRARY_EXERCISE_BY_ID(id: string) {
  return MOCK_LIBRARY_EXERCISES.find((x) => x.id === id) ?? null;
}

function cryptoRandomId() {
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
