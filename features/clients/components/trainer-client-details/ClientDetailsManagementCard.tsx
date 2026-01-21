import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import { Platform } from "react-native";

import type { ManagementForm } from "@/features/clients/hooks/trainer-client-details/useTrainerClientDetails";
import { AppInput } from "@/shared/components/AppInput";
import { BottomSheetPicker } from "@/shared/components/BottomSheetPicker";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, Text, useTheme, VStack, HStack } from "@/shared/ui";

type ClientDetailsManagementCardProps = {
  form: ManagementForm;
  setForm: React.Dispatch<React.SetStateAction<ManagementForm>>;
  statusOptions: { value: string; label: string }[];
  freqOptions: { value: string; label: string }[];
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  setNextCheckInDate: (date: Date | undefined) => void;
  formatDatePretty: (iso: string) => string;
  onSave: () => void | Promise<void>;
  onMarkCheckIn: () => void | Promise<void>;
  saveLoading: boolean;
  markCheckInLoading: boolean;
};

export function ClientDetailsManagementCard({
  form,
  setForm,
  statusOptions,
  freqOptions,
  showDatePicker,
  setShowDatePicker,
  setNextCheckInDate,
  formatDatePretty,
  onSave,
  onMarkCheckIn,
  saveLoading,
  markCheckInLoading,
}: ClientDetailsManagementCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card>
      <VStack style={{ gap: theme.spacing.md }}>
        <Text weight="bold">
          {t("linking.clientDetails.trainerManagement")}
        </Text>

        <BottomSheetPicker
          mode="single"
          label={t("linking.management.clientStatus")}
          title={t("linking.management.clientStatus")}
          value={form.clientStatus}
          onChange={(v) =>
            setForm((prev) => ({
              ...prev,
              clientStatus: (v ?? "active") as ManagementForm["clientStatus"],
            }))
          }
          options={statusOptions}
        />

        <BottomSheetPicker
          mode="single"
          label={t("linking.management.checkInFrequency")}
          title={t("linking.management.checkInFrequency")}
          value={form.checkInFrequency}
          onChange={(v) =>
            setForm((prev) => ({
              ...prev,
              checkInFrequency: (v ?? "weekly") as ManagementForm["checkInFrequency"],
            }))
          }
          options={freqOptions}
        />

        <Card background="surface2">
          <VStack style={{ gap: 10 }}>
            <Text variant="caption" style={{ opacity: 0.9 }}>
              {t("linking.management.nextCheckInAt")}
            </Text>
            <HStack align="center" justify="space-between">
              <Text>
                {form.nextCheckInAt
                  ? formatDatePretty(form.nextCheckInAt)
                  : "—"}
              </Text>
              <Button
                variant="icon"
                height={40}
                onPress={() => setShowDatePicker(true)}
                left={
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={theme.colors.accent}
                  />
                }
              />
            </HStack>
          </VStack>
        </Card>

        {showDatePicker ? (
          <DateTimePicker
            value={
              form.nextCheckInAt ? new Date(form.nextCheckInAt) : new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_event, date) => {
              if (Platform.OS !== "ios") setShowDatePicker(false);
              setNextCheckInDate(date);
            }}
          />
        ) : null}

        <AppInput
          label={t("linking.management.coachNotes")}
          value={form.coachNotes}
          onChangeText={(v) =>
            setForm((prev) => ({ ...prev, coachNotes: v }))
          }
          placeholder={t("profile.placeholders.notes")}
          multiline
          autoGrow
        />

        <HStack gap={10}>
          <Button
            fullWidth
            height={40}
            style={{ flex: 1 }}
            isLoading={saveLoading}
            onPress={() => void onSave()}
          >
            {t("common.save")}
          </Button>
        </HStack>

        <Button
          variant="secondary"
          height={40}
          isLoading={markCheckInLoading}
          onPress={() => void onMarkCheckIn()}
        >
          {t("linking.management.markCheckIn")}
        </Button>
      </VStack>
    </Card>
  );
}
