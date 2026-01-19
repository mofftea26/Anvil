import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useVideoThumbnail } from "../hooks/useVideoThumbnail";
import type { SeriesExercise } from "../types";

import { Text, useTheme } from "@/shared/ui";

type Props = {
  code: string; // A1, A2...
  exercise: SeriesExercise;
  onPress: () => void;
};

export function ExerciseCard({ code, exercise, onPress }: Props) {
  const theme = useTheme();
  const { thumbnailUri } = useVideoThumbnail(exercise.videoUrl ?? null);

  const summary = useMemo(() => {
    const setsCount = exercise.sets.length;
    const reps = exercise.sets.map((s) => s.reps).filter(Boolean);
    const minReps = reps.length ? Math.min(...reps.map(Number)) : 0;
    const maxReps = reps.length ? Math.max(...reps.map(Number)) : 0;

    const avgRest = exercise.sets.length
      ? Math.round(
          exercise.sets.reduce((a, b) => a + (Number(b.restSec) || 0), 0) /
            exercise.sets.length
        )
      : 0;

    const tempoText = `${exercise.tempo.eccentric}/${exercise.tempo.bottom}/${exercise.tempo.concentric}/${exercise.tempo.top}`;

    return {
      tempoText,
      setsText: setsCount ? `${setsCount} sets` : "0 sets",
      repsText:
        setsCount === 0
          ? "-- reps"
          : minReps === maxReps
          ? `${minReps} reps`
          : `${minReps}-${maxReps} reps`,
      restText: avgRest ? `${avgRest}s rest` : "-- rest",
    };
  }, [exercise.sets, exercise.tempo]);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Background */}
      {thumbnailUri ? (
        <Image
          source={{ uri: thumbnailUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: theme.colors.surface3 },
          ]}
        />
      )}

      {/* Overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "rgba(0,0,0,0.5)" },
        ]}
      />

      {/* Top content */}
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.codeBadge,
              { borderColor: "rgba(255,255,255,0.18)" },
            ]}
          >
            <Text style={styles.codeText}>{code}</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {exercise.title}
          </Text>
        </View>

      

        {/* Sets + Reps + Rest (same line) */}
        <View style={styles.pillRow}>
        <Pill icon="timer-outline" text={summary.tempoText} />
          <Pill icon="layers" text={summary.setsText} />
          <Pill icon="fitness" text={summary.repsText} />
          <Pill icon="hourglass-outline" text={summary.restText} />
        </View>
      </View>
    </Pressable>
  );
}

function Pill({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color="white" />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 168,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    padding: 12,
  },
  top: {
    flex: 1,
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  codeBadge: {
    minWidth: 44,
    height: 34,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingHorizontal: 10,
  },
  codeText: {
    color: "white",
    fontWeight: "900",
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
    paddingTop: 4,
  },
  pillRow: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  pillText: {
    color: "white",
    fontWeight: "800",
    fontSize: 8,
  },
});
