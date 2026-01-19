import React, { useMemo, useRef } from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";

import type { SetTypeRow } from "@/features/library/types/setTypes";
import type { WorkoutSeries } from "../types";
import { AddSeriesCard, SeriesPage } from "./SeriesPage";
type Props = {
  series: WorkoutSeries[];
  setTypes: SetTypeRow[];

  onAddSeries: () => void;
  onEditExercise: (seriesId: string, exerciseId: string) => void;
};

export function SeriesCarousel({
  series,
  setTypes,
  onAddSeries,
  onEditExercise,
}: Props) {
  const listRef = useRef<FlatList<any>>(null);
  const { width } = useWindowDimensions();

  const itemWidth = Math.min(width - 56, 420);
  const gap = 14;

  const data = useMemo(() => {
    return [...series, { id: "__add__", label: "+", exercises: [] }];
  }, [series]);

  return (
    <FlatList
      ref={listRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap,
      }}
      snapToInterval={itemWidth + gap}
      decelerationRate="fast"
      renderItem={({ item }) => {
        if (item.id === "__add__") {
          return (
            <View style={{ width: itemWidth }}>
              <AddSeriesCard onPress={onAddSeries} />
            </View>
          );
        }

        return (
          <View style={{ width: itemWidth }}>
            <SeriesPage
              series={item}
                  onEditExercise={(exerciseId) => onEditExercise(item.id, exerciseId)}
                  onAddExercise={(exerciseId) => onEditExercise(item.id, exerciseId)}
            />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({});
