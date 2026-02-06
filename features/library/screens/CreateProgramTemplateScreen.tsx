import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { StickyHeader, useTheme } from "@/shared/ui";

import { CreateTemplateFooter } from "@/features/library/components/programs/createProgram/createProgramTemplate/components/CreateTemplateFooter";
import { DescriptionField } from "@/features/library/components/programs/createProgram/createProgramTemplate/components/DescriptionField";
import { DifficultyField } from "@/features/library/components/programs/createProgram/createProgramTemplate/components/DifficultyField";
import { DurationPhasesField } from "@/features/library/components/programs/createProgram/createProgramTemplate/components/DurationPhasesField";
import { TitleField } from "@/features/library/components/programs/createProgram/createProgramTemplate/components/TitleField";
import { useCreateProgramTemplateForm } from "@/features/library/components/programs/createProgram/createProgramTemplate/hooks/useCreateProgramTemplateForm";

export default function CreateProgramTemplateScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const form = useCreateProgramTemplateForm();

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
            <TitleField
              title={form.title}
              onChangeTitle={form.setTitle}
              minTitleLength={form.limits.MIN_TITLE_LENGTH}
            />
            <DifficultyField
              difficulty={form.difficulty}
              onChangeDifficulty={form.setDifficulty}
            />
            <DurationPhasesField
              phaseCount={form.phaseCount}
              setPhaseCount={form.setPhaseCount}
              durationWeeks={form.durationWeeks}
              setDurationWeeks={form.setDurationWeeks}
              minPhases={form.limits.MIN_PHASES}
              maxPhases={form.limits.MAX_PHASES}
              minWeeks={form.limits.MIN_WEEKS}
              maxWeeks={form.limits.MAX_WEEKS}
              weeksPerPhase={form.weeksPerPhase}
            />
            <DescriptionField
              description={form.description}
              onChangeDescription={form.setDescription}
              expanded={form.descriptionExpanded}
              onToggleExpanded={() => form.setDescriptionExpanded((e) => !e)}
            />
          </View>
        </ScrollView>

        <CreateTemplateFooter
          onSubmit={form.submit}
          disabled={!form.canSubmit || form.saving}
          loading={form.saving}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  formCard: {
    borderRadius: 16,
    padding: 20,
  },
  // Field styles live with each SRP field component now.
});
