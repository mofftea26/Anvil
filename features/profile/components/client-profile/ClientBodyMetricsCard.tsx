import React from "react";
import { View } from "react-native";

import type { ClientProfileForm } from "@/features/profile/hooks/client-profile/useClientProfile";
import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

type ClientBodyMetricsCardProps = {
  form: Pick<
    ClientProfileForm,
    "unitSystem" | "heightCm" | "heightFt" | "heightIn" | "weightKg" | "weightLb"
  >;
  setForm: React.Dispatch<React.SetStateAction<ClientProfileForm>>;
};

export function ClientBodyMetricsCard({ form, setForm }: ClientBodyMetricsCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card bordered background="surface2">
      <VStack style={{ gap: theme.spacing.lg }}>
        <HStack align="center" justify="space-between">
          <Text variant="caption" muted>
            {t("profile.sections.body")}
          </Text>
          <Icon name="pulse" size={16} color={theme.colors.textMuted} />
        </HStack>

        {form.unitSystem === "imperial" ? (
          <>
            <HStack gap={theme.spacing.md}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label={t("profile.fields.heightFt")}
                  value={form.heightFt}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, heightFt: v }))
                  }
                  placeholder="5"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label={t("profile.fields.heightIn")}
                  value={form.heightIn}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, heightIn: v }))
                  }
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>
            </HStack>
            <AppInput
              label={t("profile.fields.weightLb")}
              value={form.weightLb}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, weightLb: v }))
              }
              placeholder="180"
              keyboardType="numeric"
            />
          </>
        ) : (
          <HStack gap={theme.spacing.md}>
            <View style={{ flex: 1 }}>
              <AppInput
                label={t("profile.fields.heightCm")}
                value={form.heightCm}
                onChangeText={(v) =>
                  setForm((p) => ({ ...p, heightCm: v }))
                }
                placeholder="175"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                label={t("profile.fields.weightKg")}
                value={form.weightKg}
                onChangeText={(v) =>
                  setForm((p) => ({ ...p, weightKg: v }))
                }
                placeholder="88"
                keyboardType="numeric"
              />
            </View>
          </HStack>
        )}
      </VStack>
    </Card>
  );
}
