import React from "react";

import type { ClientProfileForm } from "@/features/profile/hooks/client-profile/useClientProfile";
import type { UnitSystem } from "@/features/profile/utils/units";
import { AppInput } from "@/shared/components/AppInput";
import { BottomSheetPicker } from "@/shared/components/BottomSheetPicker";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Text, useTheme, VStack } from "@/shared/ui";

type ClientPreferencesCardProps = {
  form: Pick<ClientProfileForm, "unitSystem" | "activityLevel" | "target" | "notes">;
  setForm: React.Dispatch<React.SetStateAction<ClientProfileForm>>;
  unitOptions: { value: string; label: string }[];
  activityOptions: { value: string; label: string; description?: string }[];
  targetOptions: { value: string; label: string }[];
  onUnitChange: (next: UnitSystem) => void;
};

export function ClientPreferencesCard({
  form,
  setForm,
  unitOptions,
  activityOptions,
  targetOptions,
  onUnitChange,
}: ClientPreferencesCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card>
      <VStack style={{ gap: theme.spacing.lg }}>
        <Text variant="caption" muted>
          {t("profile.sections.preferences")}
        </Text>

        <BottomSheetPicker
          label={t("profile.fields.unitSystem")}
          title={t("profile.fields.unitSystem")}
          mode="single"
          value={form.unitSystem || null}
          onChange={(v) => {
            const next = (v ?? "metric") as UnitSystem;
            onUnitChange(next);
          }}
          placeholder={t("common.selectPlaceholder")}
          options={unitOptions}
        />

        <BottomSheetPicker
          label={t("profile.fields.activityLevel")}
          title={t("profile.fields.activityLevel")}
          mode="single"
          value={form.activityLevel || null}
          onChange={(v) =>
            setForm((p) => ({ ...p, activityLevel: v ?? "" }))
          }
          placeholder={t("common.selectPlaceholder")}
          options={activityOptions}
          showDescriptions
        />

        <BottomSheetPicker
          label={t("profile.fields.target")}
          title={t("profile.fields.target")}
          mode="single"
          value={form.target || null}
          onChange={(v) => setForm((p) => ({ ...p, target: v ?? "" }))}
          placeholder={t("common.selectPlaceholder")}
          options={targetOptions}
        />

        <AppInput
          label={t("profile.fields.notes")}
          value={form.notes}
          onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))}
          placeholder={t("profile.placeholders.notes")}
          multiline
          numberOfLines={3}
          autoGrow
        />
      </VStack>
    </Card>
  );
}
