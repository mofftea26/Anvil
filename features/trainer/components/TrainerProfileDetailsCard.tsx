import React from "react";
import { View } from "react-native";

import { TrainerProfileCertificationsSection } from "@/features/trainer/components/TrainerProfileCertificationsSection";
import type { TrainerProfileForm } from "@/features/trainer/hooks/useTrainerProfile";
import { AppInput } from "@/shared/components/AppInput";
import { Card, HStack, Text, VStack } from "@/shared/ui";

type TrainerProfileDetailsCardProps = {
  form: TrainerProfileForm;
  saveError: string | null;
  updateField: <K extends keyof TrainerProfileForm>(
    key: K,
    value: TrainerProfileForm[K]
  ) => void;
  certModalOpen: boolean;
  certDraft: string;
  setCertDraft: (value: string) => void;
  onStartAddCert: () => void;
  onRemoveCert: (cert: string) => void;
  onCancelAddCert: () => void;
  onAddCert: () => void;
  t: (key: string) => string;
  theme: {
    colors: {
      border: string;
      surface: string;
      danger: string;
    };
    radii: {
      lg: number;
    };
    spacing: {
      lg: number;
      md: number;
      sm: number;
    };
  };
};

export function TrainerProfileDetailsCard({
  form,
  saveError,
  updateField,
  certModalOpen,
  certDraft,
  setCertDraft,
  onStartAddCert,
  onRemoveCert,
  onCancelAddCert,
  onAddCert,
  t,
  theme,
}: TrainerProfileDetailsCardProps) {
  return (
    <Card>
      <VStack style={{ gap: theme.spacing.lg }}>
        <Text variant="caption" muted>
          {t("profile.sections.trainer")}
        </Text>

        <HStack gap={theme.spacing.md}>
          <View style={{ flex: 1 }}>
            <AppInput
              label={t("auth.firstName")}
              value={form.firstName}
              onChangeText={(value) => updateField("firstName", value)}
              placeholder="John"
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label={t("auth.lastName")}
              value={form.lastName}
              onChangeText={(value) => updateField("lastName", value)}
              placeholder="Doe"
              autoCapitalize="words"
            />
          </View>
        </HStack>

        <AppInput
          label={t("profile.fields.phone")}
          value={form.phone}
          onChangeText={(value) => updateField("phone", value)}
          placeholder="+961 …"
          keyboardType="phone-pad"
        />

        <AppInput
          label={t("profile.fields.bio")}
          value={form.bio}
          onChangeText={(value) => updateField("bio", value)}
          placeholder={t("profile.placeholders.bio")}
          multiline
          numberOfLines={3}
          autoGrow
        />

        <TrainerProfileCertificationsSection
          certifications={form.certifications}
          certModalOpen={certModalOpen}
          certDraft={certDraft}
          onStartAddCert={onStartAddCert}
          onRemoveCert={onRemoveCert}
          onCancelAddCert={onCancelAddCert}
          onAddCert={onAddCert}
          onChangeDraft={setCertDraft}
          t={t}
          theme={theme}
        />

        <AppInput
          label={t("profile.fields.instagram")}
          value={form.instagram}
          onChangeText={(value) => updateField("instagram", value)}
          placeholder="@yourhandle"
          autoCapitalize="none"
        />

        <AppInput
          label={t("profile.fields.website")}
          value={form.website}
          onChangeText={(value) => updateField("website", value)}
          placeholder="https://…"
          autoCapitalize="none"
        />

        {saveError ? <Text color={theme.colors.danger}>{saveError}</Text> : null}
      </VStack>
    </Card>
  );
}
