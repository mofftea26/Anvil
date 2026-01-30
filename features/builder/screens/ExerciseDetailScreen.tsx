import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { fetchExerciseById } from "../api/exercises.api";
import { VideoPlayerModal } from "../components/VideoPlayerModal";
import type { Exercise } from "../types/exercise";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

import { Icon, StickyHeader, Text, useTheme } from "@/shared/ui";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ExerciseDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ exerciseId: string }>();
  const exerciseId = params.exerciseId ?? null;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!exerciseId) {
        setError("Missing exercise");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchExerciseById(exerciseId);
        if (!mounted) return;
        setExercise(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load exercise");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [exerciseId]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <StickyHeader title="Exercise" showBackButton />
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.textMuted }}>{error ?? "Not found"}</Text>
        </View>
      </View>
    );
  }

  const muscles = exercise.targetMuscles?.filter((m) => m?.trim()) ?? [];
  const equipment = exercise.equipment?.filter((e) => e?.trim()) ?? [];
  const hasInstructions =
    exercise.instructions != null && exercise.instructions.trim() !== "";

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader title={exercise.title} showBackButton />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero – matches ExercisePickerCard */}
        <View style={[styles.heroWrap, { backgroundColor: theme.colors.surface2 }]}>
          {exercise.imageUrl ? (
            <Image
              source={{ uri: exercise.imageUrl }}
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
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={StyleSheet.absoluteFillObject}
          />
          {exercise.videoUrl && (
            <Pressable
              style={[styles.playCta, { backgroundColor: hexToRgba(theme.colors.accent, 0.95) }]}
              onPress={() => setVideoModalVisible(true)}
            >
              <Icon name="video" size={24} color={theme.colors.background} />
              <Text weight="bold" style={[styles.playCtaLabel, { color: theme.colors.background }]}>
                Play video
              </Text>
            </Pressable>
          )}
          {!exercise.imageUrl && !exercise.videoUrl && (
            <View style={styles.heroPlaceholder}>
              <Icon name="video" size={48} color={theme.colors.textMuted} />
            </View>
          )}
        </View>

        {/* Title – prominent, no section label */}
        <Text
          weight="bold"
          style={[styles.pageTitle, { color: theme.colors.text }]}
          numberOfLines={3}
        >
          {exercise.title}
        </Text>

        {/* Target muscles – pills like picker card */}
        {muscles.length > 0 && (
          <View style={styles.section}>
            <Text
              weight="bold"
              style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
            >
              Target muscles
            </Text>
            <View style={styles.pillsRow}>
              {muscles.map((muscle) => (
                <View
                  key={muscle}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: hexToRgba(theme.colors.accent2, 0.15),
                      borderColor: hexToRgba(theme.colors.accent2, 0.3),
                    },
                  ]}
                >
                  <Text
                    style={[styles.pillText, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {muscle}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Equipment – pills, muted style */}
        {equipment.length > 0 && (
          <View style={styles.section}>
            <Text
              weight="bold"
              style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
            >
              Equipment
            </Text>
            <View style={styles.pillsRow}>
              {equipment.map((item) => (
                <View
                  key={item}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: hexToRgba(theme.colors.textMuted, 0.12),
                      borderColor: hexToRgba(theme.colors.textMuted, 0.22),
                    },
                  ]}
                >
                  <Text
                    style={[styles.pillText, { color: theme.colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions – card block */}
        {hasInstructions && (
          <View
            style={[
              styles.cardBlock,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              weight="bold"
              style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
            >
              Instructions
            </Text>
            <Text style={[styles.body, { color: theme.colors.text }]}>
              {exercise.instructions}
            </Text>
          </View>
        )}

        {/* Media – compact row / CTA */}
        <View
          style={[
            styles.cardBlock,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            weight="bold"
            style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
          >
            Media
          </Text>
          {exercise.videoUrl ? (
            <Pressable
              onPress={() => setVideoModalVisible(true)}
              style={({ pressed }) => [
                styles.mediaCta,
                {
                  backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                  borderColor: hexToRgba(theme.colors.accent, 0.35),
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Icon name="video" size={20} color={theme.colors.accent} />
              <Text weight="bold" style={[styles.mediaCtaLabel, { color: theme.colors.accent }]}>
                Play video
              </Text>
            </Pressable>
          ) : null}
          {exercise.imageUrl && (
            <Text
              style={[styles.caption, { color: theme.colors.textMuted }]}
              numberOfLines={2}
            >
              Image attached
            </Text>
          )}
          {!exercise.imageUrl && !exercise.videoUrl && (
            <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
              No media
            </Text>
          )}
        </View>

        {/* Details – metadata card */}
        <View
          style={[
            styles.cardBlock,
            styles.metaBlock,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            weight="bold"
            style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
          >
            Details
          </Text>
          <MetaRow label="Stock" value={exercise.isStock ? "Yes" : "No"} theme={theme} />
          <MetaRow label="Archived" value={exercise.isArchived ? "Yes" : "No"} theme={theme} />
          <MetaRow label="Created" value={formatDate(exercise.createdAt)} theme={theme} />
          <MetaRow label="Updated" value={formatDate(exercise.updatedAt)} theme={theme} />
          {exercise.lastEditedAt != null && (
            <MetaRow label="Last edited" value={formatDate(exercise.lastEditedAt)} theme={theme} />
          )}
          {exercise.ownerTrainerId && (
            <MetaRow label="Owner" value={exercise.ownerTrainerId} theme={theme} />
          )}
          {exercise.sourceTemplateId && (
            <MetaRow label="Source template" value={exercise.sourceTemplateId} theme={theme} />
          )}
        </View>
      </ScrollView>

      <VideoPlayerModal
        visible={videoModalVisible}
        videoUrl={exercise.videoUrl}
        title={exercise.title}
        onClose={() => setVideoModalVisible(false)}
      />
    </View>
  );
}

function MetaRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: { colors: { text: string; textMuted: string } };
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.caption, { color: theme.colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    height: 220,
    position: "relative",
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCta: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  playCtaLabel: {
    fontSize: 15,
  },
  pageTitle: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 140,
  },
  cardBlock: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  metaBlock: {
    marginBottom: 40,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    gap: 12,
  },
  mediaCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  mediaCtaLabel: {
    fontSize: 14,
  },
});
