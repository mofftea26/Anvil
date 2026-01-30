import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { createProgramTemplate } from "@/features/library/api/programTemplates.api";
import type { ProgramDifficulty } from "@/features/library/types/programTemplate";
import { PROGRAM_DIFFICULTIES } from "@/features/library/types/programTemplate";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";
import { Button, Icon, StickyHeader, Text, useTheme } from "@/shared/ui";

const DIFFICULTY_KEYS: Record<ProgramDifficulty, string> = {
  beginner: "library.programsScreen.difficultyBeginner",
  intermediate: "library.programsScreen.difficultyIntermediate",
  advanced: "library.programsScreen.difficultyAdvanced",
};

const DEFAULT_DURATION_WEEKS = 6;
const MIN_WEEKS = 1;
const MAX_WEEKS = 52;
const MIN_TITLE_LENGTH = 2;

export default function CreateProgramTemplateScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>("beginner");
  const [durationWeeks, setDurationWeeks] = useState(DEFAULT_DURATION_WEEKS);
  const [description, setDescription] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit =
    title.trim().length >= MIN_TITLE_LENGTH &&
    durationWeeks >= MIN_WEEKS &&
    durationWeeks <= MAX_WEEKS;

  async function handleSubmit() {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const created = await createProgramTemplate({
        title: title.trim(),
        description: description.trim() || null,
        durationWeeks,
        difficulty,
      });
      appToast.success(t("library.createProgram.createAndEdit") + " – done");
      router.replace(
        `/(trainer)/library/program-templates/${created.id}` as Parameters<typeof router.replace>[0]
      );
    } catch (e: unknown) {
      if (__DEV__) {
        console.warn("[CreateProgramTemplate] create failed:", e);
        if (e && typeof e === "object" && "message" in e) {
          console.warn("[CreateProgramTemplate] error.message:", (e as { message?: string }).message);
        }
      }
      appToast.error(e instanceof Error ? e.message : "Failed to create program");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <StickyHeader
        title={t("library.createProgram.title", "New program template")}
        showBackButton
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { padding: theme.spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>
            {t("library.createProgram.titleLabel", "Title")} *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("library.createProgram.titlePlaceholder", "Program name")}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            maxLength={100}
          />
          {title.length > 0 && title.length < MIN_TITLE_LENGTH && (
            <Text style={[styles.hint, { color: theme.colors.danger }]}>
              Min {MIN_TITLE_LENGTH} characters
            </Text>
          )}

          {/* Difficulty */}
          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: theme.spacing.lg }]}>
            {t("library.createProgram.difficultyLabel", "Difficulty")}
          </Text>
          <View style={styles.segmentedRow}>
            {PROGRAM_DIFFICULTIES.map((d) => (
              <Pressable
                key={d}
                onPress={() => setDifficulty(d)}
                style={[
                  styles.segmentedBtn,
                  {
                    backgroundColor: difficulty === d ? theme.colors.accent : theme.colors.surface2,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentedLabel,
                    { color: difficulty === d ? theme.colors.background : theme.colors.text },
                  ]}
                >
                  {t(DIFFICULTY_KEYS[d])}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Duration weeks */}
          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: theme.spacing.lg }]}>
            {t("library.createProgram.durationWeeks", "Duration (weeks)")}
          </Text>
          <View style={[styles.stepperRow, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
            <Pressable
              onPress={() => setDurationWeeks((w) => Math.max(MIN_WEEKS, w - 1))}
              style={styles.stepperBtn}
              disabled={durationWeeks <= MIN_WEEKS}
            >
              <Icon name="remove" size={20} color={durationWeeks <= MIN_WEEKS ? theme.colors.textMuted : theme.colors.text} />
            </Pressable>
            <Text style={[styles.stepperValue, { color: theme.colors.text }]}>{durationWeeks}</Text>
            <Pressable
              onPress={() => setDurationWeeks((w) => Math.min(MAX_WEEKS, w + 1))}
              style={styles.stepperBtn}
              disabled={durationWeeks >= MAX_WEEKS}
            >
              <Icon name="add" size={20} color={durationWeeks >= MAX_WEEKS ? theme.colors.textMuted : theme.colors.text} />
            </Pressable>
          </View>

          {/* Description (optional, expandable) */}
          <Pressable
            onPress={() => setDescriptionExpanded((e) => !e)}
            style={[styles.expandHeader, { borderBottomColor: theme.colors.border, marginTop: theme.spacing.lg }]}
          >
            <Text style={{ color: theme.colors.textMuted }}>
              {t("library.createProgram.descriptionLabel", "Description (optional)")}
            </Text>
            <Icon
              name={descriptionExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
          {descriptionExpanded && (
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t("library.createProgram.descriptionPlaceholder", "Brief description")}
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          )}

          <Button
            onPress={handleSubmit}
            disabled={!canSubmit || saving}
            isLoading={saving}
            style={{ marginTop: theme.spacing.xl }}
          >
            {t("library.createProgram.createAndEdit", "Create & Edit")}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: { fontSize: 12, marginTop: 4 },
  segmentedRow: { flexDirection: "row", gap: 8 },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  segmentedLabel: { fontSize: 14, fontWeight: "600" },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  stepperBtn: { padding: 14 },
  stepperValue: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700" },
  expandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
});
