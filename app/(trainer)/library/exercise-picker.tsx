import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { useExerciseLibrary } from "@/src/features/library/hooks/useExerciseLibrary";
import { Card, Chip, Divider, Input, Text, useTheme } from "@/src/shared/ui";

const TARGET_MUSCLE_FILTERS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
];

export default function ExercisePickerScreen() {
  const theme = useTheme();

  const [search, setSearch] = useState("");
  const [targetMuscle, setTargetMuscle] = useState<string | null>(null);

  const { rows, isLoading, error } = useExerciseLibrary({
    search,
    targetMuscle,
  });

  const styles = useMemo(
    () =>
      createStyles({
        bg: theme.colors.background,
        surface: theme.colors.surface,
        surface2: theme.colors.surface2,
        text: theme.colors.text,
        textMuted: theme.colors.textMuted,
        border: theme.colors.border,
        accent: theme.colors.accent,
      }),
    [theme.colors]
  );

  const openVideo = async (url?: string | null) => {
    if (!url) return;
    await WebBrowser.openBrowserAsync(url);
  };

  const selectExercise = (exerciseId: string) => {
    // ✅ For now, we just go back.
    // In the next step, we’ll connect this to WorkoutBuilder draft storage.
    console.log("Selected exercise:", exerciseId);
    router.back();
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Pick Exercise</Text>
          <Text style={styles.subtitle}>Search and filter your exercise library</Text>
        </View>
      </View>

      {/* Search + Filter */}
      <View style={styles.controls}>
        <View style={{ flex: 1 }}>
          <Input
            label="Search exercises..."
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            leftIcon={<Ionicons name="search" size={16} color={theme.colors.textMuted} />}
          />
        </View>

        <Pressable
          onPress={() => {
            // Later: open BottomSheetPicker
            // For now: quick toggle behavior demo
            setTargetMuscle((prev) => (prev ? null : "Chest"));
          }}
          style={styles.filterBtn}
        >
          <Ionicons name="options" size={18} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Quick filter chips */}
      <View style={styles.chipsRow}>
        <Chip
          label="All"
          isActive={!targetMuscle}
          onPress={() => setTargetMuscle(null)}
        />
        {TARGET_MUSCLE_FILTERS.slice(0, 5).map((m) => (
          <Chip
            key={m}
            label={m}
            isActive={targetMuscle === m}
            onPress={() => setTargetMuscle(m)}
          />
        ))}
      </View>

      <Divider />

      {/* List */}
      {error ? (
        <View style={styles.stateBox}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.textMuted} />
          <Text style={styles.stateText}>
            Exercises table not ready yet or missing columns.
            {"\n"}
            Error: {error}
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.stateBox}>
          <Ionicons name="refresh" size={18} color={theme.colors.textMuted} />
          <Text style={styles.stateText}>Loading exercises...</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => selectExercise(item.id)}>
              <Card style={styles.exerciseCard}>
                <View style={styles.exerciseRow}>
                  <View style={styles.thumbWrap}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                    ) : (
                      <View style={styles.thumbFallback}>
                        <Ionicons name="image" size={18} color={theme.colors.textMuted} />
                      </View>
                    )}

                    <Pressable
                      onPress={() => openVideo(item.videoUrl)}
                      style={styles.playBtn}
                    >
                      <Ionicons name="play" size={12} color="#000" />
                    </Pressable>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseTitle}>{item.title}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="body" size={14} color={theme.colors.textMuted} />
                      <Text style={styles.metaText}>
                        {item.primaryTargetMuscle ?? "Unknown target"}
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function createStyles(c: {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
}) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
      padding: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surface2,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    title: {
      fontSize: 18,
      color: c.text,
      fontWeight: "700",
    },
    subtitle: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 2,
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    filterBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 10,
    },
    stateBox: {
      marginTop: 18,
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.border,
      gap: 8,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    stateText: {
      flex: 1,
      color: c.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    exerciseCard: {
      marginTop: 10,
      padding: 12,
    },
    exerciseRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    thumbWrap: {
      width: 56,
      height: 56,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.border,
    },
    thumb: {
      width: "100%",
      height: "100%",
    },
    thumbFallback: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    playBtn: {
      position: "absolute",
      right: 6,
      bottom: 6,
      width: 22,
      height: 22,
      borderRadius: 999,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    exerciseTitle: {
      color: c.text,
      fontSize: 15,
      fontWeight: "700",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    metaText: {
      color: c.textMuted,
      fontSize: 13,
    },
  });
}
