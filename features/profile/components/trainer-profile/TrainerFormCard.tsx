import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

import type { TrainerProfileForm } from "@/features/profile/hooks/trainer-profile/useTrainerProfile";
import { AppInput } from "@/shared/components/AppInput";
import { PhoneInput } from "@/shared/components/PhoneInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, Chip, Text, useAppAlert, useTheme, VStack, HStack } from "@/shared/ui";

type TrainerFormCardProps = {
  form: TrainerProfileForm;
  setForm: React.Dispatch<React.SetStateAction<TrainerProfileForm>>;
};

export function TrainerFormCard({ form, setForm }: TrainerFormCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();

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
              onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))}
              placeholder={t("common.placeholders.firstName")}
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label={t("auth.lastName")}
              value={form.lastName}
              onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))}
              placeholder={t("common.placeholders.lastName")}
              autoCapitalize="words"
            />
          </View>
        </HStack>

        <PhoneInput
          label={t("profile.fields.phone")}
          value={form.phone}
          onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
          placeholder={t("profile.placeholders.phone")}
        />

        <AppInput
          label={t("profile.fields.bio")}
          value={form.bio}
          onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
          placeholder={t("profile.placeholders.bio")}
          multiline
          numberOfLines={3}
          autoGrow
        />

        <VStack style={{ gap: theme.spacing.sm }}>
          <HStack align="center" justify="space-between">
            <Text variant="caption" style={{ opacity: 0.9 }}>
              {t("profile.fields.certifications")}
            </Text>
            <Button
              variant="icon"
              height={40}
              onPress={() => {
                alert.prompt({
                  title: t("profile.certifications.addLabel"),
                  label: t("profile.certifications.addLabel"),
                  placeholder: t("profile.placeholders.certifications"),
                  confirmText: t("common.add"),
                  cancelText: t("common.cancel"),
                  onConfirm: (value) => {
                    setForm((p) => ({
                      ...p,
                      certifications: p.certifications.includes(value)
                        ? p.certifications
                        : [...p.certifications, value],
                    }));
                  },
                });
              }}
              left={
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={theme.colors.text}
                />
              }
            />
          </HStack>

          {form.certifications.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {form.certifications.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  isActive={false}
                  onPress={() => {
                    alert.confirm({
                      title: t("profile.certifications.deleteTitle"),
                      message: c,
                      confirmText: t("common.delete"),
                      cancelText: t("common.cancel"),
                      destructive: true,
                      onConfirm: () => {
                        setForm((p) => ({
                          ...p,
                          certifications: p.certifications.filter((x) => x !== c),
                        }));
                      },
                    });
                  }}
                />
              ))}
            </View>
          ) : (
            <Text muted>{t("profile.certifications.empty")}</Text>
          )}
        </VStack>

        <AppInput
          label={t("profile.fields.instagram")}
          value={form.instagram}
          onChangeText={(v) => setForm((p) => ({ ...p, instagram: v }))}
          placeholder={t("profile.placeholders.instagram")}
          autoCapitalize="none"
        />

        <AppInput
          label={t("profile.fields.website")}
          value={form.website}
          onChangeText={(v) => setForm((p) => ({ ...p, website: v }))}
          placeholder={t("profile.placeholders.website")}
          autoCapitalize="none"
        />
      </VStack>
    </Card>
  );
}
