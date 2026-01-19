import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { StickyHeader, Text, useTheme } from "@/src/shared/ui";
import { fetchWorkoutById } from "../api/workouts.api";

export default function WorkoutDetailsScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ workoutId?: string }>();
  const workoutId = params.workoutId ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState<string>("Workout");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setIsLoading(true);
        setError(null);

        if (!workoutId) throw new Error("Missing workoutId");

        const row = await fetchWorkoutById(workoutId);
        if (!row) throw new Error("Workout not found");

        if (!mounted) return;
        setTitle(row.title);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load workout");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [workoutId]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader title={title} showBackButton />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <View style={{ height: 10 }} />
          <Text style={{ opacity: 0.7 }}>Loading workout...</Text>
        </View>
      ) : error ? (
        <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
          <Text style={{ color: "rgba(255,100,100,0.95)", fontWeight: "900" }}>
            {error}
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
          <Text style={{ fontWeight: "900", fontSize: 18 }}>
            ✅ Published successfully
          </Text>
          <View style={{ height: 8 }} />
          <Text style={{ opacity: 0.7 }}>WorkoutId: {workoutId}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
