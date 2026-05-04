import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import { Platform, View } from "react-native";

import type { ClientProfileForm } from "@/features/profile/hooks/client-profile/useClientProfile";
import { AppInput } from "@/shared/components/AppInput";
import { PhoneInput } from "@/shared/components/PhoneInput";
import { BottomSheetPicker } from "@/shared/components/BottomSheetPicker";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

type ClientBasicInfoCardProps = {
  form: Pick<
    ClientProfileForm,
    "firstName" | "lastName" | "phone" | "gender" | "birthDate" | "nationality"
  >;
  setForm: React.Dispatch<React.SetStateAction<ClientProfileForm>>;
  genderOptions: { value: string; label: string }[];
  nationalityOptions: { value: string; label: string }[];
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  dateValue: Date;
  onPickBirthDate: (date: Date) => void;
};

export function ClientBasicInfoCard({
  form,
  setForm,
  genderOptions,
  nationalityOptions,
  showDatePicker,
  setShowDatePicker,
  dateValue,
  onPickBirthDate,
}: ClientBasicInfoCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card bordered background="surface2">
      <VStack style={{ gap: theme.spacing.lg }}>
        <HStack align="center" justify="space-between">
          <Text variant="caption" muted>
            {t("profile.sections.basic")}
          </Text>
          <Icon name="person" size={16} color={theme.colors.textMuted} />
        </HStack>

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

        <BottomSheetPicker
          label={t("profile.fields.gender")}
          title={t("profile.fields.gender")}
          mode="single"
          value={form.gender || null}
          onChange={(v) => setForm((p) => ({ ...p, gender: v ?? "" }))}
          placeholder={t("common.selectPlaceholder")}
          options={genderOptions}
        />

        <VStack style={{ gap: theme.spacing.sm }}>
          <Text variant="caption" style={{ opacity: 0.9 }}>
            {t("profile.fields.birthDate")}
          </Text>
          <Button
            variant="secondary"
            onPress={() => setShowDatePicker(true)}
            contentStyle={{
              justifyContent: "flex-start",
              paddingHorizontal: theme.spacing.md,
            }}
          >
            <Text
              color={form.birthDate ? theme.colors.text : "rgba(255,255,255,0.45)"}
            >
              {form.birthDate || t("profile.placeholders.date")}
            </Text>
          </Button>
          {showDatePicker ? (
            <DateTimePicker
              value={dateValue}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) onPickBirthDate(selected);
              }}
            />
          ) : null}
        </VStack>

        <BottomSheetPicker
          label={t("profile.fields.nationality")}
          title={t("profile.fields.nationality")}
          mode="single"
          value={form.nationality || null}
          onChange={(v) =>
            setForm((p) => ({ ...p, nationality: v ?? "" }))
          }
          placeholder={t("common.selectPlaceholder")}
          options={nationalityOptions}
          searchable
          searchPlaceholder={t("common.search")}
        />
      </VStack>
    </Card>
  );
}
