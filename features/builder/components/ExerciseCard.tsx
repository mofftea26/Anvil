import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useVideoThumbnail } from "../hooks/useVideoThumbnail";
import type { SeriesExercise } from "../types";
import { VideoPlayerModal } from "./VideoPlayerModal";

import { Icon, Text, useTheme } from "@/shared/ui";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

type Props = {
  code: string; // A1, A2...
  exercise: SeriesExercise;
  onEdit: () => void;
};

export function ExerciseCard({ code, exercise, onEdit }: Props) {
  const theme = useTheme();
  const { thumbnailUri } = useVideoThumbnail(exercise.videoUrl ?? null);
  const [showVideo, setShowVideo] = useState(false);

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

  const handleCardPress = () => {
    if (exercise.videoUrl) {
      setShowVideo(true);
    }
  };

  return (
    <>
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface3,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        {/* Background Image or Gradient */}
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[
              hexToRgba(theme.colors.accent, 0.12),
              hexToRgba(theme.colors.accent2, 0.06),
              theme.colors.surface3,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Subtle Overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.4)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Edit Button - Top Right */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={({ pressed }) => [
              styles.editButton,
              {
                backgroundColor: hexToRgba(theme.colors.accent, 0.25),
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon name="edit" size={16} color={theme.colors.accent} />
          </Pressable>

          {/* Top Row: Code and Title */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.codeBadge,
                {
                  backgroundColor: hexToRgba(theme.colors.accent, 0.2),
                  borderColor: hexToRgba(theme.colors.accent, 0.35),
                },
              ]}
            >
              <Text
                weight="bold"
                style={{ fontSize: 11, color: theme.colors.accent }}
              >
                {code}
              </Text>
            </View>

            <View style={styles.titleContainer}>
              <Text
                weight="bold"
                style={styles.title}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {exercise.title}
              </Text>
            </View>
          </View>

          {/* Center: Play Icon */}
          {exercise.videoUrl && (
            <View style={styles.playIconContainer}>
              <View
                style={[
                  styles.playIconCircle,
                  { backgroundColor: hexToRgba(theme.colors.accent, 0.3) },
                ]}
              >
                <Icon name="play" size={32} color={theme.colors.accent} />
              </View>
            </View>
          )}

          {/* Bottom: Stats Row */}
          <View style={styles.statsRow}>
            <StatBadge icon="timer" text={summary.tempoText} theme={theme} />
            <StatBadge icon="layers" text={summary.setsText} theme={theme} />
            <StatBadge icon="fitness" text={summary.repsText} theme={theme} />
            {summary.restText !== "-- rest" && (
              <StatBadge icon="hourglass" text={summary.restText} theme={theme} />
            )}
          </View>
        </View>
      </Pressable>

      {/* Video Modal */}
      <VideoPlayerModal
        visible={showVideo}
        videoUrl={exercise.videoUrl}
        title={exercise.title}
        onClose={() => setShowVideo(false)}
      />
    </>
  );
}

function StatBadge({ icon, text, theme }: { icon: string; text: string; theme: any }) {
  return (
    <View
      style={[
        styles.statBadge,
        {
          backgroundColor: "rgba(255,255,255,0.1)",
          borderColor: "rgba(255,255,255,0.15)",
        },
      ]}
    >
      <Icon name={icon} size={10} color="white" />
      <Text style={styles.statText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    minHeight: 180,
  },
  content: {
    padding: 14,
    position: "relative",
    zIndex: 1,
    flex: 1,
    justifyContent: "space-between",
  },
  editButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 36,
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: "white",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  playIconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: "auto",
  },
  statBadge: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statText: {
    color: "white",
    fontWeight: "600",
    fontSize: 9,
  },
});
