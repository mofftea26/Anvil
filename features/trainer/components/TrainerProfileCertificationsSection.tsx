import React from "react";
import { View } from "react-native";

import { AppInput } from "@/shared/components/AppInput";
import { Button, Chip, HStack, Text, VStack } from "@/shared/ui";

type TrainerProfileCertificationsSectionProps = {
  certifications: string[];
  certModalOpen: boolean;
  certDraft: string;
  onStartAddCert: () => void;
  onRemoveCert: (cert: string) => void;
  onCancelAddCert: () => void;
  onAddCert: () => void;
  onChangeDraft: (value: string) => void;
  t: (key: string) => string;
  theme: {
    colors: {
      border: string;
      surface: string;
    };
    radii: {
      lg: number;
    };
    spacing: {
      sm: number;
    };
  };
};

export function TrainerProfileCertificationsSection({
  certifications,
  certModalOpen,
  certDraft,
  onStartAddCert,
  onRemoveCert,
  onCancelAddCert,
  onAddCert,
  onChangeDraft,
  t,
  theme,
}: TrainerProfileCertificationsSectionProps) {
  return (
    <VStack style={{ gap: theme.spacing.sm }}>
      <HStack align="center" justify="space-between">
        <Text variant="caption" style={{ opacity: 0.9 }}>
          {t("profile.fields.certifications")}
        </Text>
        <Button variant="secondary" height={40} onPress={onStartAddCert}>
          + {t("common.add")}
        </Button>
      </HStack>

      {certifications.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {certifications.map((cert) => (
            <Chip key={cert} label={cert} onPress={() => onRemoveCert(cert)} />
          ))}
        </View>
      ) : (
        <Text muted>{t("profile.certifications.empty")}</Text>
      )}

      {certModalOpen ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surface,
            padding: 12,
            gap: 10,
          }}
        >
          <AppInput
            label={t("profile.certifications.addLabel")}
            value={certDraft}
            onChangeText={onChangeDraft}
            placeholder={t("profile.placeholders.certifications")}
            autoCapitalize="words"
          />
          <HStack gap={10}>
            <Button
              variant="secondary"
              fullWidth
              style={{ flex: 1 }}
              onPress={onCancelAddCert}
            >
              {t("common.cancel")}
            </Button>
            <Button fullWidth style={{ flex: 1 }} onPress={onAddCert}>
              {t("common.add")}
            </Button>
          </HStack>
        </View>
      ) : null}
    </VStack>
  );
}
