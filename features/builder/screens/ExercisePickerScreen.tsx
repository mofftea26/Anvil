import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { StickySaveBar } from "../components/StickySaveBar";
import { MOCK_LIBRARY_EXERCISES } from "../data/mockLibraryExercises";
import { setPendingExercisePick } from "../utils/exercisePickerBridge";

import { Icon, StickyHeader, Text, useTheme } from "@/shared/ui";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

export default function ExercisePickerScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const params = useLocalSearchParams<{
    targetSeriesId?: string;
  }>();

  const targetSeriesId = params.targetSeriesId ?? null;

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_LIBRARY_EXERCISES;
    return MOCK_LIBRARY_EXERCISES.filter((x) => x.title.toLowerCase().includes(q));
  }, [query]);

  const selectedIds = useMemo(() => {
    return Object.keys(selected).filter((id) => selected[id]);
  }, [selected]);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function onCancel() {
    router.back();
  }

  function onConfirm() {
    if (!targetSeriesId) {
      router.back();
      return;
    }

    if (!selectedIds.length) {
      router.back();
      return;
    }

    // store selection in bridge memory
    setPendingExercisePick({
      token: Date.now().toString(),
      targetSeriesId,
      exerciseIds: selectedIds,
    });

    // go back without remounting builder
    router.back();
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader title={t("builder.exercisePicker.title")} showBackButton />

      {/* Search */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="search" size={16} color="rgba(255,255,255,0.75)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("builder.exercisePicker.searchPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={[styles.searchInput, { color: theme.colors.text }]}
          />
          {query.length ? (
            <Pressable onPress={() => setQuery("")} style={{ padding: 4 }}>
              <Icon name="close" size={16} color="rgba(255,255,255,0.75)" />
            </Pressable>
          ) : null}
        </View>

        {/* selection counter */}
        <View style={styles.counterRow}>
          <View
            style={[
              styles.countPill,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon
              name="checkmark-circle"
              size={16}
              color={theme.colors.accent}
            />
            <Text style={{ fontWeight: "900" }}>{selectedIds.length}</Text>
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const isOn = Boolean(selected[item.id]);

          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={[
                styles.row,
                {
                  backgroundColor: theme.colors.surface2,
                  borderColor: isOn ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <View style={[styles.thumb, { backgroundColor: theme.colors.surface3 }]}>
                <Icon
                  name="videocam"
                  size={18}
                  color="rgba(255,255,255,0.85)"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "900" }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={{ opacity: 0.7, marginTop: 2 }} numberOfLines={1}>
                  {isOn
                    ? t("builder.exercisePicker.tapToUnselect")
                    : t("builder.exercisePicker.tapToSelect")}
                </Text>
              </View>

              <View
                style={[
                  styles.check,
                  {
                    backgroundColor: isOn ? theme.colors.accent : "rgba(255,255,255,0.08)",
                    borderColor: isOn ? theme.colors.accent : "rgba(255,255,255,0.14)",
                  },
                ]}
              >
                <Icon
                  name={isOn ? "checkmark" : "add"}
                  size={16}
                  color={isOn ? "black" : "white"}
                />
              </View>
            </Pressable>
          );
        }}
      />

      <StickySaveBar onSave={onConfirm} onDiscard={onCancel} isSaving={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontWeight: "800",
    paddingVertical: 0,
  },

  counterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
  },

  row: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
