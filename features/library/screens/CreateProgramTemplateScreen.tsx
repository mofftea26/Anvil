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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createProgramTemplate } from "@/features/library/api/programTemplates.api";
import type { ProgramDifficulty } from "@/features/library/types/programTemplate";
import { PROGRAM_DIFFICULTIES } from "@/features/library/types/programTemplate";
import {
  DIFFICULTY_ICONS,
  getDifficultyColors,
} from "@/features/library/utils/programColors";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  Button,
  Icon,
  StickyHeader,
  Text,
  useTheme,
} from "@/shared/ui";

const DIFFICULTY_KEYS: Record<ProgramDifficulty, string> = {
  beginner: "library.programsScreen.difficultyBeginner",
  intermediate: "library.programsScreen.difficultyIntermediate",
  advanced: "library.programsScreen.difficultyAdvanced",
};

const DEFAULT_DURATION_WEEKS = 6;
const MIN_WEEKS = 1;
const MAX_WEEKS = 52;
const MIN_PHASES = 1;
const MAX_PHASES = 12;
const MIN_TITLE_LENGTH = 2;

/** Split total weeks across phases (first phases get +1 when remainder). */
function getWeeksPerPhase(totalWeeks: number, phaseCount: number): number[] {
  const count = Math.max(1, Math.min(phaseCount, totalWeeks));
  const base = Math.floor(totalWeeks / count);
  const remainder = totalWeeks % count;
  return Array.from(
    { length: count },
    (_, i) => base + (i < remainder ? 1 : 0)
  );
}

export default function CreateProgramTemplateScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>("beginner");
  const [durationWeeks, setDurationWeeks] = useState(DEFAULT_DURATION_WEEKS);
  const [phaseCount, setPhaseCount] = useState(1);
  const [description, setDescription] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const weeksPerPhase = getWeeksPerPhase(durationWeeks, phaseCount);

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
        phaseCount,
      });
      appToast.success(t("library.createProgram.createAndEdit") + " – done");
      router.replace(
        `/(trainer)/library/program-templates/${created.id}` as Parameters<
          typeof router.replace
        >[0]
      );
    } catch (e: unknown) {
      if (__DEV__) {
        console.warn("[CreateProgramTemplate] create failed:", e);
        if (e && typeof e === "object" && "message" in e) {
          console.warn(
            "[CreateProgramTemplate] error.message:",
            (e as { message?: string }).message
          );
        }
      }
      appToast.error(
        e instanceof Error ? e.message : "Failed to create program"
      );
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
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              padding: theme.spacing.lg,
              paddingBottom: theme.spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.formCard, { backgroundColor: theme.colors.surface }]}
          >
            {/* Title */}
            <View style={styles.field}>
              <Text
                style={[styles.fieldLabel, { color: theme.colors.textMuted }]}
              >
                {t("library.createProgram.titleLabel", "Title")} *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t(
                  "library.createProgram.titlePlaceholder",
                  "Program name"
                )}
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
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
            </View>

            {/* Difficulty */}
            <View style={styles.field}>
              <Text
                style={[styles.fieldLabel, { color: theme.colors.textMuted }]}
              >
                {t("library.createProgram.difficultyLabel", "Difficulty")}
              </Text>
              <View style={styles.difficultyRow}>
                {PROGRAM_DIFFICULTIES.map((d) => {
                  const diffColors = getDifficultyColors(d);
                  const isSelected = difficulty === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDifficulty(d)}
                      style={[
                        styles.difficultyOption,
                        {
                          backgroundColor: isSelected
                            ? diffColors.bg
                            : theme.colors.background,
                        },
                      ]}
                    >
                      <Icon
                        name={DIFFICULTY_ICONS[d]}
                        size={22}
                        color={diffColors.main}
                        strokeWidth={1.5}
                      />
                      <Text
                        style={[
                          styles.difficultyOptionLabel,
                          {
                            color: isSelected
                              ? theme.colors.text
                              : theme.colors.textMuted,
                          },
                        ]}
                      >
                        {t(DIFFICULTY_KEYS[d])}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Phases & Duration */}
            <View style={styles.field}>
              <Text
                style={[styles.fieldLabel, { color: theme.colors.textMuted }]}
              >
                {t(
                  "library.createProgram.durationAndPhases",
                  "Phases & duration"
                )}
              </Text>
              <View style={styles.stepperRowWrap}>
                <View style={styles.stepperBlock}>
                  <View style={styles.stepperLabelRow}>
                    <Icon
                      name="cells"
                      size={14}
                      color={theme.colors.textMuted}
                      strokeWidth={1.5}
                    />
                    <Text
                      style={[
                        styles.stepperSubLabel,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {t("library.createProgram.phases", "Phases")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stepperRow,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Pressable
                      onPress={() =>
                        setPhaseCount((p) => Math.max(MIN_PHASES, p - 1))
                      }
                      style={styles.stepperBtn}
                      disabled={phaseCount <= MIN_PHASES}
                    >
                      <Icon
                        name="remove"
                        size={20}
                        color={
                          phaseCount <= MIN_PHASES
                            ? theme.colors.textMuted
                            : theme.colors.text
                        }
                      />
                    </Pressable>
                    <Text
                      style={[
                        styles.stepperValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {phaseCount}
                    </Text>
                    <Pressable
                      onPress={() =>
                        setPhaseCount((p) => Math.min(MAX_PHASES, p + 1))
                      }
                      style={styles.stepperBtn}
                      disabled={phaseCount >= MAX_PHASES}
                    >
                      <Icon
                        name="add"
                        size={20}
                        color={
                          phaseCount >= MAX_PHASES
                            ? theme.colors.textMuted
                            : theme.colors.text
                        }
                      />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.stepperBlock}>
                  <View style={styles.stepperLabelRow}>
                    <Icon
                      name="calendar-03"
                      size={14}
                      color={theme.colors.textMuted}
                      strokeWidth={1.5}
                    />
                    <Text
                      style={[
                        styles.stepperSubLabel,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      {t("library.createProgram.weeks", "Weeks")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stepperRow,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Pressable
                      onPress={() =>
                        setDurationWeeks((w) => Math.max(MIN_WEEKS, w - 1))
                      }
                      style={styles.stepperBtn}
                      disabled={durationWeeks <= MIN_WEEKS}
                    >
                      <Icon
                        name="remove"
                        size={20}
                        color={
                          durationWeeks <= MIN_WEEKS
                            ? theme.colors.textMuted
                            : theme.colors.text
                        }
                      />
                    </Pressable>
                    <Text
                      style={[
                        styles.stepperValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {durationWeeks}
                    </Text>
                    <Pressable
                      onPress={() =>
                        setDurationWeeks((w) => Math.min(MAX_WEEKS, w + 1))
                      }
                      style={styles.stepperBtn}
                      disabled={durationWeeks >= MAX_WEEKS}
                    >
                      <Icon
                        name="add"
                        size={20}
                        color={
                          durationWeeks >= MAX_WEEKS
                            ? theme.colors.textMuted
                            : theme.colors.text
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
              <Text
                style={[
                  styles.phaseBreakdown,
                  { color: theme.colors.textMuted, marginTop: 10 },
                ]}
                numberOfLines={2}
              >
                {weeksPerPhase
                  .map((wks, i) =>
                    t(
                      "library.createProgram.phaseWeeks",
                      "Phase {{n}} ({{w}} wks)",
                      { n: i + 1, w: wks }
                    )
                  )
                  .join(" · ")}
              </Text>
            </View>

            {/* Description (optional) */}
            <View style={styles.field}>
              <Pressable
                onPress={() => setDescriptionExpanded((e) => !e)}
                style={styles.expandRow}
              >
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textMuted, marginBottom: 0 },
                  ]}
                >
                  {t(
                    "library.createProgram.descriptionLabel",
                    "Description (optional)"
                  )}
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
                  placeholder={t(
                    "library.createProgram.descriptionPlaceholder",
                    "Brief description"
                  )}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      marginTop: 10,
                    },
                  ]}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              )}
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.ctaFooter,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
              paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <Button
            onPress={handleSubmit}
            disabled={!canSubmit || saving}
            isLoading={saving}
            style={styles.cta}
          >
            {t("library.createProgram.createAndEdit", "Create & Edit")}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  ctaFooter: {},
  formCard: {
    borderRadius: 16,
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: { fontSize: 12, marginTop: 6 },
  difficultyRow: { flexDirection: "row", gap: 10 },
  difficultyOption: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  difficultyOptionLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  stepperRowWrap: { flexDirection: "row", gap: 12 },
  stepperBlock: { flex: 1 },
  stepperLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  stepperSubLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  stepperBtn: { padding: 10 },
  stepperValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  phaseBreakdown: {
    fontSize: 13,
    lineHeight: 18,
  },
  expandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textArea: { minHeight: 88, textAlignVertical: "top" },
  cta: { minHeight: 50 },
});
