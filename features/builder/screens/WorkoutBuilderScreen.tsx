import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { addWorkoutToProgramDay } from "@/features/library/api/programTemplates.api";
import { useSetTypesDictionary } from "@/features/library/hooks/useSetTypesDictionary";
import type { SetTypeRow } from "@/features/library/types/setTypes";
import { consumePendingProgramDayAttachment } from "@/features/library/utils/programDayAttachmentBridge";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { AnimatedArrow, appToast, DurationCircle, HStack, Icon, Text, useTheme } from "@/shared/ui";

import { useFocusEffect } from "@react-navigation/native";
import { AddSeriesCard, SeriesPage } from "../components/SeriesPage";
import { SetsEditorSheet } from "../components/SetsEditorSheet";
import { StickySaveBar } from "../components/StickySaveBar";
import { MOCK_LIBRARY_EXERCISES } from "../data/mockLibraryExercises";
import { useWorkoutEditor } from "../hooks/useWorkoutEditor";
import type { SeriesExercise, WorkoutSeries } from "../types";
import { calculateWorkoutDuration } from "../utils/calculateWorkoutDuration";
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
    title,
    setTitle,
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

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [editingExercise, setEditingExercise] = useState<{
    seriesId: string;
    exerciseId: string;
  } | null>(null);

  const { rows: setTypesRows = [] } = useSetTypesDictionary();

  const flatRef = useRef<FlatList<CarouselItem>>(null);
  const titleInputRef = useRef<TextInput>(null);
  const [currentSeriesIndex, setCurrentSeriesIndex] = useState(0);

  const durationMinutes = useMemo(() => {
    return calculateWorkoutDuration(series);
  }, [series]);

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

      const sourceList =
        pending.exercises && pending.exercises.length > 0
          ? pending.exercises
          : pending.exerciseIds
              .map((id) => MOCK_LIBRARY_EXERCISES.find((x) => x.id === id))
              .filter(Boolean)
              .map((x) => ({ id: x!.id, title: x!.title, videoUrl: x!.videoUrl ?? null }));

      const picked = sourceList.map((x) => ({
        id: cryptoRandomId(),
        title: x.title,
        videoUrl: x.videoUrl,
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

    const pendingProgramDay = mode === "new" ? consumePendingProgramDayAttachment() : null;
    if (pendingProgramDay) {
      try {
        await addWorkoutToProgramDay(
          pendingProgramDay.programId,
          pendingProgramDay.phaseIndex,
          pendingProgramDay.weekIndex,
          pendingProgramDay.dayOrder,
          res.workoutId
        );
        appToast.success(t("builder.toasts.workoutPublished"));
        router.replace(
          `/(trainer)/library/program-templates/${pendingProgramDay.programId}` as Parameters<typeof router.replace>[0]
        );
      } catch (e: unknown) {
        appToast.error(e instanceof Error ? e.message : "Failed to attach workout");
        router.back();
      }
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
        <View style={styles.customHeader}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
        </View>
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
      <View style={styles.customHeader}>
        <HStack align="center" justify="space-between" style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>

          <Pressable
            onPress={() => {
              setIsEditingTitle(true);
              setTimeout(() => titleInputRef.current?.focus(), 100);
            }}
            style={styles.titleContainer}
          >
            {isEditingTitle ? (
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                onBlur={() => setIsEditingTitle(false)}
                onSubmitEditing={() => setIsEditingTitle(false)}
                style={[
                  styles.titleInput,
                  {
                    color: theme.colors.text,
                    fontSize: 18,
                    fontWeight: "600",
                  },
                ]}
                placeholder={t("builder.workoutBuilder.titlePlaceholder")}
                placeholderTextColor={theme.colors.textMuted}
                maxLength={50}
              />
            ) : (
              <HStack align="center" gap={8}>
                <Text
                  weight="semibold"
                  style={[
                    styles.titleText,
                    {
                      color: theme.colors.text,
                      fontSize: 18,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {title || t("builder.workoutBuilder.defaultTitle")}
                </Text>
                <Icon name="edit" size={16} color={theme.colors.textMuted} />
              </HStack>
            )}
          </Pressable>

          <View style={styles.rightSection}>
            <DurationCircle minutes={durationMinutes} size="small" />
          </View>
        </HStack>
      </View>

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
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          if (index < series.length) {
            setCurrentSeriesIndex(index);
          }
        }}
        renderItem={({ item, index }) => {
          if (item.kind === "addSeries") {
            return (
              <View style={{ width, paddingHorizontal: 14, height: "100%" }}>
                <AddSeriesCard onPress={onAddSeries} />
              </View>
            );
          }

          const s = series.find((x) => x.id === item.id);
          if (!s) return <View style={{ width, height: "100%" }} />;

          return (
            <View style={{ width, paddingHorizontal: 14, height: "100%" }}>
                <SeriesPage
                  series={s}
                  seriesIndex={index}
                  onEditExercise={(exerciseId) => onEditExercise(s.id, exerciseId)}
                  onAddExercise={onAddExercise}
                />
            </View>
          );
        }}
      />

      <View style={styles.arrowsContainer}>
        {currentSeriesIndex > 0 && (
          <View style={styles.leftArrows}>
            <AnimatedArrow direction="left" />
            <AnimatedArrow direction="left" delay={200} />
            <AnimatedArrow direction="left" delay={400} />
          </View>
        )}
        
        <View style={styles.swipeTextContainer}>
          <AnimatedSwipeText />
        </View>
        
        {/* Right arrows always appear */}
        <View style={styles.rightArrows}>
          <AnimatedArrow direction="right" />
          <AnimatedArrow direction="right" delay={200} />
          <AnimatedArrow direction="right" delay={400} />
        </View>
      </View>

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

function AnimatedSwipeText() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const opacity = useState(new Animated.Value(0.4))[0];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Text
        style={{
          color: theme.colors.textMuted,
          fontSize: 12,
          fontWeight: "600",
          letterSpacing: 0.5,
        }}
      >
        {t("builder.workoutBuilder.swipe")}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  customHeader: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  headerContent: {
    width: "100%",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    textAlign: "center",
  },
  titleInput: {
    textAlign: "center",
    minWidth: 100,
    paddingVertical: 4,
  },
  rightSection: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  arrowsContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  leftArrows: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    width: 60,
    justifyContent: "flex-start",
  },
  swipeTextContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  rightArrows: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    width: 60,
    justifyContent: "flex-end",
    marginLeft: "auto",
  },
});
