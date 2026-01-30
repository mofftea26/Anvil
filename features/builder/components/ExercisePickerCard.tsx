import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { Exercise } from "../types/exercise";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { formatSlugToLabel } from "@/shared/utils";

import { Icon, Text, useTheme } from "@/shared/ui";

type Props = {
  exercise: Exercise;
  selected: boolean;
  onCardPress: () => void;
  onAddPress: () => void;
};

export function ExercisePickerCard({
  exercise,
  selected,
  onCardPress,
  onAddPress,
}: Props) {
  const theme = useTheme();
  const muscles = exercise.targetMuscles?.filter((m) => m?.trim()) ?? [];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          borderWidth: selected ? 2 : 1,
          overflow: "hidden",
        },
      ]}
    >
      {/* Hero image / placeholder */}
      <Pressable
        onPress={onCardPress}
        style={({ pressed }) => [styles.imageWrap, pressed && styles.imagePressed]}
      >
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
          colors={["transparent", "rgba(0,0,0,0.5)"]}
          style={styles.imageOverlay}
        />
        {/* Add / selected button – top right */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onAddPress();
          }}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: selected
                ? theme.colors.accent
                : hexToRgba(theme.colors.surface, 0.95),
              borderColor: selected ? theme.colors.accent : "rgba(255,255,255,0.2)",
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Icon
            name={selected ? "checkmark" : "add"}
            size={22}
            color={selected ? theme.colors.background : theme.colors.text}
          />
        </Pressable>
      </Pressable>

      {/* Content */}
      <Pressable
        onPress={onCardPress}
        style={({ pressed }) => [styles.content, pressed && styles.contentPressed]}
      >
        <Text
          weight="bold"
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {exercise.title}
        </Text>

        {muscles.length > 0 && (
          <View style={styles.pillsRow}>
            {muscles.slice(0, 4).map((muscle) => (
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
                  style={[styles.pillText, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {formatSlugToLabel(muscle)}
                </Text>
              </View>
            ))}
            {muscles.length > 4 && (
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor: hexToRgba(theme.colors.textMuted, 0.12),
                    borderColor: hexToRgba(theme.colors.textMuted, 0.2),
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: theme.colors.textMuted }]}>
                  +{muscles.length - 4}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.viewHint, { color: theme.colors.textMuted }]}>
            View details
          </Text>
          <Icon name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
  },
  imageWrap: {
    height: 120,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  imagePressed: {
    opacity: 0.96,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  addButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    paddingTop: 14,
  },
  contentPressed: {
    opacity: 0.92,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 100,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewHint: {
    fontSize: 12,
    fontWeight: "600",
  },
});
