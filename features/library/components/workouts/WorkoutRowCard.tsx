import type { WorkoutRow } from "@/features/builder/api/workouts.api";
import { formatShortDate } from "@/features/library/utils/formatShortDate";
import React from "react";
import { Pressable } from "react-native";

import { Card, Text, VStack } from "@/shared/ui";

type WorkoutRowCardProps = {
  workout: WorkoutRow;
  updatedAtLabel: string;
  defaultTitle: string;
  onPress: () => void;
};

export function WorkoutRowCard({
  workout,
  updatedAtLabel,
  defaultTitle,
  onPress,
}: WorkoutRowCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <Card>
        <VStack style={{ gap: 6 }}>
          <Text weight="bold" numberOfLines={1}>
            {workout.title || defaultTitle}
          </Text>
          <Text muted>
            {updatedAtLabel} {formatShortDate(workout.updatedAt)}
          </Text>
        </VStack>
      </Card>
    </Pressable>
  );
}
