import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Card, Input, Text, useTheme } from "../../../../src/shared/ui";

function createLocalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const STORAGE_PREFIX = "anvil:workoutDraft:";

export default function NewWorkoutDraftScreen() {
  const theme = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = useMemo(() => title.trim().length >= 3, [title]);

  async function onCreate() {
    if (!canCreate) {
      Alert.alert("Title required", "Please enter a workout title (min 3 chars).");
      return;
    }

    const id = createLocalId("workout");
    const now = new Date().toISOString();

    const draft = {
      id,
      title: title.trim(),
      description: description.trim() || null,
      createdAt: now,
      updatedAt: now,
      blocks: [
        {
          id: createLocalId("block"),
          label: "A",
          orderIndex: 0,
          exercises: [],
        },
      ],
    };

    await AsyncStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(draft));
    router.replace(`/(trainer)/library/workout-builder/${id}` as any);
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: "700" }}>
          New Workout
        </Text>

        <View style={{ height: 12 }} />

        <Input
          label="Workout title (e.g. Upper A — Strength)"
          placeholder="Workout title (e.g. Upper A — Strength)"
          value={title}
          onChangeText={setTitle}
        />

        <View style={{ height: 10 }} />

        <Input
          label="Description (optional)"
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 90, textAlignVertical: "top" }}
        />

        <View style={{ height: 14 }} />

        <Button onPress={onCreate} disabled={!canCreate}>
          Create Workout
        </Button>

        <View style={{ height: 10 }} />

        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
          This creates a draft locally for ultra-fast building.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  card: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
  },
});
