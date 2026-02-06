import { createProgramTemplate } from "@/features/library/api/programTemplates.api";
import type { ProgramDifficulty } from "@/features/library/types/programTemplate";
import { appToast } from "@/shared/ui";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { getWeeksPerPhase } from "../utils/getWeeksPerPhase";

const DEFAULT_DURATION_WEEKS = 6;
const MIN_WEEKS = 1;
const MAX_WEEKS = 52;
const MIN_PHASES = 1;
const MAX_PHASES = 12;
const MIN_TITLE_LENGTH = 2;

export function useCreateProgramTemplateForm() {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>("beginner");
  const [durationWeeks, setDurationWeeks] = useState(DEFAULT_DURATION_WEEKS);
  const [phaseCount, setPhaseCount] = useState(1);
  const [description, setDescription] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const weeksPerPhase = useMemo(
    () => getWeeksPerPhase(durationWeeks, phaseCount),
    [durationWeeks, phaseCount]
  );

  const canSubmit =
    title.trim().length >= MIN_TITLE_LENGTH &&
    durationWeeks >= MIN_WEEKS &&
    durationWeeks <= MAX_WEEKS;

  const submit = useCallback(async () => {
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
      appToast.success("Created – done");
      router.replace(
        `/(trainer)/library/program-templates/${created.id}` as Parameters<
          typeof router.replace
        >[0]
      );
    } catch (e: unknown) {
      appToast.error(
        e instanceof Error ? e.message : "Failed to create program"
      );
    } finally {
      setSaving(false);
    }
  }, [
    canSubmit,
    saving,
    title,
    description,
    durationWeeks,
    difficulty,
    phaseCount,
  ]);

  return {
    title,
    setTitle,
    difficulty,
    setDifficulty,
    durationWeeks,
    setDurationWeeks,
    phaseCount,
    setPhaseCount,
    description,
    setDescription,
    descriptionExpanded,
    setDescriptionExpanded,
    weeksPerPhase,
    canSubmit,
    saving,
    submit,
    limits: {
      MIN_WEEKS,
      MAX_WEEKS,
      MIN_PHASES,
      MAX_PHASES,
      MIN_TITLE_LENGTH,
    },
  };
}
