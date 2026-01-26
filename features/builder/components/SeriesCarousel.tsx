import React, { useMemo } from "react";
import { FlatList, useWindowDimensions, View } from "react-native";

import type { WorkoutSeries } from "../types";
import { AddSeriesCard, SeriesPage } from "./SeriesPage";
type Props = {
  series: WorkoutSeries[];
  onAddSeries: () => void;
  onEditExercise: (seriesId: string, exerciseId: string) => void;
};

export function SeriesCarousel({
  series,
  onAddSeries,
  onEditExercise,
}: Props) {
  const { width } = useWindowDimensions();

  const itemWidth = Math.min(width - 56, 420);
  const gap = 14;

  const data = useMemo(() => {
    return [...series, { id: "__add__", label: "+", exercises: [] }];
  }, [series]);

  return (
    <FlatList
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

