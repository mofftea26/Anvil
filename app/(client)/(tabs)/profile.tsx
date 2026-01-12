import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform } from "react-native";
import { Card, Form, Separator, Text, XStack, YStack } from "tamagui";

import { AppButton } from "../../../src/shared/components/AppButton";
import { AppInput } from "../../../src/shared/components/AppInput";
import { BottomSheetPicker } from "../../../src/shared/components/BottomSheetPicker";
import { KeyboardScreen } from "../../../src/shared/components/KeyboardScreen";

import { useAuthActions } from "../../../src/features/auth/hooks/useAuthActions";
import {
  updateMyUserRow,
  upsertClientProfile,
} from "../../../src/features/profile/api/profileApi";
import { useMyProfile } from "../../../src/features/profile/hooks/useMyProfile";
import { countries } from "../../../src/shared/constants/countries";
import { useAppSelector } from "../../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ClientProfileScreen() {
  const { t } = useAppTranslation();
  const { me, clientProfile, isLoading, error, refetch } = useMyProfile();
  const auth = useAppSelector((s) => s.auth);
  const { isBusy: signingOut, doSignOut } = useAuthActions();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const initial = useMemo(() => {
    return {
      firstName: me?.firstName ?? "",
      lastName: me?.lastName ?? "",
      nationality: clientProfile?.nationality ?? "",
      gender: clientProfile?.gender ?? "",
      birthDate: clientProfile?.birthDate ?? "",
      heightCm: clientProfile?.heightCm?.toString() ?? "",
      weightKg: clientProfile?.weightKg?.toString() ?? "",
      unitSystem: clientProfile?.unitSystem ?? "",
      activityLevel: clientProfile?.activityLevel ?? "",
      target: clientProfile?.target ?? "",
    };
  }, [me, clientProfile]);

  const [form, setForm] = useState(initial);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  // ----- options -----

  const nationalityOptions = useMemo(
    () => countries.map((c) => ({ value: c.name, label: c.name })),
    []
  );

  const genderOptions = useMemo(
    () => [
      { value: "male", label: t("profile.gender.male") },
      { value: "female", label: t("profile.gender.female") },
    ],
    [t]
  );

  const unitOptions = useMemo(
    () => [
      { value: "metric", label: t("profile.unitSystem.metric") },
      { value: "imperial", label: t("profile.unitSystem.imperial") },
    ],
    [t]
  );

  const activityOptions = useMemo(
    () => [
      {
        value: "sedentary",
        label: t("profile.activityLevel.sedentary"),
        description: t("profile.activityLevel.sedentaryDesc"),
      },
      {
        value: "light",
        label: t("profile.activityLevel.light"),
        description: t("profile.activityLevel.lightDesc"),
      },
      {
        value: "moderate",
        label: t("profile.activityLevel.moderate"),
        description: t("profile.activityLevel.moderateDesc"),
      },
      {
        value: "active",
        label: t("profile.activityLevel.active"),
        description: t("profile.activityLevel.activeDesc"),
      },
      {
        value: "athlete",
        label: t("profile.activityLevel.athlete"),
        description: t("profile.activityLevel.athleteDesc"),
      },
    ],
    [t]
  );

  const targetOptions = useMemo(
    () => [
      { value: "fatLoss", label: t("profile.target.fatLoss") },
      { value: "maintenance", label: t("profile.target.maintenance") },
      { value: "muscleGain", label: t("profile.target.muscleGain") },
      { value: "recomp", label: t("profile.target.recomp") },
      { value: "performance", label: t("profile.target.performance") },
    ],
    [t]
  );

  const onPickBirthDate = (date: Date) => {
    setForm((p) => ({ ...p, birthDate: formatDateISO(date) }));
  };

  const onSave = async () => {
    if (!auth.userId || !me) return;

    setSaving(true);
    setSaveError(null);

    try {
      await updateMyUserRow(auth.userId, {
        userId: auth.userId,
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
      });

      const height = form.heightCm.trim() ? Number(form.heightCm.trim()) : null;
      const weight = form.weightKg.trim() ? Number(form.weightKg.trim()) : null;

      if (height !== null && Number.isNaN(height))
        throw new Error(`${t("profile.fields.heightCm")}: invalid number`);
      if (weight !== null && Number.isNaN(weight))
        throw new Error(`${t("profile.fields.weightKg")}: invalid number`);

      await upsertClientProfile(auth.userId, {
        userId: auth.userId,
        nationality: form.nationality || null,
        gender: form.gender || null,
        birthDate: form.birthDate || null,
        heightCm: height,
        weightKg: weight,
        unitSystem: form.unitSystem || null,
        activityLevel: form.activityLevel || null,
        target: form.target || null,
      });

      await refetch();
    } catch (e: any) {
      setSaveError(e?.message ?? t("auth.errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await doSignOut();
    router.replace("/");
  };

  const dateValue = form.birthDate
    ? new Date(form.birthDate)
    : new Date(1995, 0, 1);

  return (
    <KeyboardScreen padding={18} bottomSpace={110}>
      <YStack
        gap="$4"
        backgroundColor="$background"
        padding="$4"
        paddingBottom="$6"
      >
        <Text fontSize={22} fontWeight="700">
          {t("tabs.profile")}
        </Text>

        {error ? <Text color="$accent2">{error}</Text> : null}

        {/* Account */}
        <Card
          bordered
          borderColor="$borderColor"
          backgroundColor="$surface"
          borderRadius="$10"
          padding="$5"
        >
          <YStack gap="$2">
            <Text fontSize={13} opacity={0.75}>
              {t("profile.sections.account")}
            </Text>

            <Text fontSize={16} fontWeight="700">
              {(me?.firstName ?? "") + " " + (me?.lastName ?? "")}
            </Text>

            <Text opacity={0.75}>{me?.email ?? ""}</Text>

            <Text opacity={0.75}>
              {t("client.profileCardRole")}: {me?.role ?? ""}
            </Text>
          </YStack>
        </Card>

        {/* Form */}
        <Card
          bordered
          borderColor="$borderColor"
          backgroundColor="$surface"
          borderRadius="$10"
          padding="$5"
        >
          <Form onSubmit={() => void onSave()}>
            <YStack gap="$4">
              {/* Basic info */}
              <Text fontSize={13} opacity={0.75}>
                {t("profile.sections.basic")}
              </Text>

              <XStack gap="$3">
                <YStack flex={1}>
                  <AppInput
                    label={t("auth.firstName")}
                    value={form.firstName}
                    onChangeText={(v) =>
                      setForm((p) => ({ ...p, firstName: v }))
                    }
                    placeholder="John"
                    autoCapitalize="words"
                  />
                </YStack>

                <YStack flex={1}>
                  <AppInput
                    label={t("auth.lastName")}
                    value={form.lastName}
                    onChangeText={(v) =>
                      setForm((p) => ({ ...p, lastName: v }))
                    }
                    placeholder="Doe"
                    autoCapitalize="words"
                  />
                </YStack>
              </XStack>

              <Separator opacity={0.4} />

              {/* Body metrics */}
              <Text fontSize={13} opacity={0.75}>
                {t("profile.sections.body")}
              </Text>

              <BottomSheetPicker
                label={t("profile.fields.gender")}
                title={t("profile.fields.gender")}
                mode="single"
                value={form.gender || null}
                onChange={(v) => setForm((p) => ({ ...p, gender: v ?? "" }))}
                placeholder={t("common.selectPlaceholder")}
                options={genderOptions}
              />

              {/* Birth date */}
              <YStack gap="$2">
                <Text fontSize={13} opacity={0.85}>
                  {t("profile.fields.birthDate")}
                </Text>

                <AppButton
                  height={50}
                  borderRadius="$6"
                  backgroundColor="$surface"
                  borderColor="$borderColor"
                  borderWidth={1}
                  justifyContent="flex-start"
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    color={form.birthDate ? "$color" : "rgba(255,255,255,0.45)"}
                  >
                    {form.birthDate || t("profile.placeholders.date")}
                  </Text>
                </AppButton>

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
              </YStack>

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

              <XStack gap="$3">
                <YStack flex={1}>
                  <AppInput
                    label={t("profile.fields.heightCm")}
                    value={form.heightCm}
                    onChangeText={(v) =>
                      setForm((p) => ({ ...p, heightCm: v }))
                    }
                    placeholder="175"
                    keyboardType="numeric"
                  />
                </YStack>

                <YStack flex={1}>
                  <AppInput
                    label={t("profile.fields.weightKg")}
                    value={form.weightKg}
                    onChangeText={(v) =>
                      setForm((p) => ({ ...p, weightKg: v }))
                    }
                    placeholder="88"
                    keyboardType="numeric"
                  />
                </YStack>
              </XStack>

              <Separator opacity={0.4} />

              {/* Preferences */}
              <Text fontSize={13} opacity={0.75}>
                {t("profile.sections.preferences")}
              </Text>

              <BottomSheetPicker
                label={t("profile.fields.unitSystem")}
                title={t("profile.fields.unitSystem")}
                mode="single"
                value={form.unitSystem || null}
                onChange={(v) =>
                  setForm((p) => ({ ...p, unitSystem: v ?? "" }))
                }
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

              {saveError ? <Text color="$accent2">{saveError}</Text> : null}

              <Form.Trigger asChild>
                <AppButton
                  height={50}
                  borderRadius="$8"
                  backgroundColor="$accent"
                  color="$background"
                  isLoading={saving || isLoading}
                >
                  {t("profile.actions.saveChanges")}
                </AppButton>
              </Form.Trigger>

              <AppButton
                height={48}
                borderRadius="$8"
                backgroundColor="$surface"
                borderColor="$borderColor"
                borderWidth={1}
                isLoading={signingOut}
                onPress={() => void onSignOut()}
              >
                {t("profile.actions.signOut")}
              </AppButton>
            </YStack>
          </Form>
        </Card>
      </YStack>
    </KeyboardScreen>
  );
}
