import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, View } from "react-native";

import { AppInput } from "../../../src/shared/components/AppInput";
import { BottomSheetPicker } from "../../../src/shared/components/BottomSheetPicker";
import { KeyboardScreen } from "../../../src/shared/components/KeyboardScreen";

import { useAuthActions } from "../../../src/features/auth/hooks/useAuthActions";
import {
  useUpdateMyUserRowMutation,
  useUpsertClientProfileMutation,
} from "../../../src/features/profile/api/profileApiSlice";
import { useMyProfile } from "../../../src/features/profile/hooks/useMyProfile";
import { profileActions } from "../../../src/features/profile/store/profileSlice";
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLb,
  lbToKg,
  toNumberOrNull,
  type UnitSystem,
} from "../../../src/features/profile/utils/units";
import { countries } from "../../../src/shared/constants/countries";
import { useAppDispatch } from "../../../src/shared/hooks/useAppDispatch";
import { useAppSelector } from "../../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import {
  appToast,
  Button,
  Card,
  Divider,
  HStack,
  Text,
  useTheme,
  VStack,
} from "../../../src/shared/ui";

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function ClientProfileScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const { me, clientProfile, isLoading, error, refetch } = useMyProfile();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const globalUnitSystem = useAppSelector((s) => s.profile.unitSystem);
  const { isBusy: signingOut, doSignOut } = useAuthActions();
  const [updateMyUserRow] = useUpdateMyUserRowMutation();
  const [upsertClientProfile] = useUpsertClientProfileMutation();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const buildFormFromProfile = React.useCallback(
    (unitSystem: UnitSystem) => {
      const cm = clientProfile?.heightCm ?? null;
      const kg = clientProfile?.weightKg ?? null;
      const ftIn = cm !== null ? cmToFeetInches(cm) : null;
      const lb = kg !== null ? kgToLb(kg) : null;

      return {
        firstName: me?.firstName ?? "",
        lastName: me?.lastName ?? "",
        phone: clientProfile?.phone ?? "",
        nationality: clientProfile?.nationality ?? "",
        gender: clientProfile?.gender ?? "",
        birthDate: clientProfile?.birthDate ?? "",
        heightCm: cm !== null ? String(Math.round(cm)) : "",
        weightKg: kg !== null ? String(Math.round(kg)) : "",
        heightFt: ftIn ? String(ftIn.ft) : "",
        heightIn: ftIn ? String(ftIn.inches) : "",
        weightLb: lb !== null ? String(Math.round(lb)) : "",
        unitSystem,
        activityLevel: clientProfile?.activityLevel ?? "",
        target: clientProfile?.target ?? "",
        notes: clientProfile?.notes ?? "",
      };
    },
    [clientProfile, me]
  );

  const [form, setForm] = useState(() => {
    const initialUnit = ((clientProfile?.unitSystem as
      | UnitSystem
      | undefined) ??
      globalUnitSystem ??
      "metric") as UnitSystem;
    return buildFormFromProfile(initialUnit);
  });

  // Sync from backend when profile loads/changes, but keep user's currently selected unitSystem.
  React.useEffect(() => {
    setForm((prev) =>
      buildFormFromProfile((prev.unitSystem as UnitSystem) || "metric")
    );
  }, [buildFormFromProfile]);

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
      await updateMyUserRow({
        userId: auth.userId,
        payload: {
          firstName: form.firstName.trim() || null,
          lastName: form.lastName.trim() || null,
        },
      }).unwrap();

      const unitSystem = (form.unitSystem as UnitSystem) || "metric";
      const height =
        unitSystem === "imperial"
          ? (() => {
              const ft = toNumberOrNull(form.heightFt) ?? 0;
              const inches = toNumberOrNull(form.heightIn) ?? 0;
              const cm = feetInchesToCm(ft, inches);
              return Number.isFinite(cm) ? cm : null;
            })()
          : toNumberOrNull(form.heightCm);

      const weight =
        unitSystem === "imperial"
          ? (() => {
              const lb = toNumberOrNull(form.weightLb);
              if (lb === null) return null;
              return lbToKg(lb);
            })()
          : toNumberOrNull(form.weightKg);

      if (height !== null && Number.isNaN(height))
        throw new Error(
          `${t("profile.fields.heightCm")}: ${t("common.invalidNumber")}`
        );
      if (weight !== null && Number.isNaN(weight))
        throw new Error(
          `${t("profile.fields.weightKg")}: ${t("common.invalidNumber")}`
        );

      await upsertClientProfile({
        userId: auth.userId,
        payload: {
          phone: form.phone.trim() || null,
          nationality: form.nationality || null,
          gender: form.gender || null,
          birthDate: form.birthDate || null,
          heightCm: height,
          weightKg: weight,
          unitSystem: form.unitSystem || null,
          activityLevel: form.activityLevel || null,
          target: form.target || null,
          notes: form.notes.trim() || null,
        },
      }).unwrap();

      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (e: any) {
      setSaveError(e?.message ?? t("auth.errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await doSignOut();
    appToast.info(t("auth.toasts.signedOut"));
    router.replace("/");
  };

  const dateValue = form.birthDate
    ? new Date(form.birthDate)
    : new Date(1995, 0, 1);

  return (
    <KeyboardScreen padding={12}>
      <VStack
        style={{
          gap: theme.spacing.lg,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text variant="title" weight="bold">
          {t("tabs.profile")}
        </Text>

        {error ? <Text color={theme.colors.accent2}>{error}</Text> : null}

        {/* Account */}
        <Card>
          <VStack style={{ gap: theme.spacing.sm }}>
            <Text variant="caption" muted>
              {t("profile.sections.account")}
            </Text>

            <Text weight="bold" style={{ fontSize: 16 }}>
              {(me?.firstName ?? "") + " " + (me?.lastName ?? "")}
            </Text>

            <Text muted>{me?.email ?? ""}</Text>

            <Text muted>
              {t("client.profileCardRole")}: {me?.role ?? ""}
            </Text>
          </VStack>
        </Card>

        {/* Form */}
        <Card>
          <VStack style={{ gap: theme.spacing.lg }}>
            {/* Basic info */}
            <Text variant="caption" muted>
              {t("profile.sections.basic")}
            </Text>

            <HStack gap={theme.spacing.md}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label={t("auth.firstName")}
                  value={form.firstName}
                  onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))}
                  placeholder="John"
                  autoCapitalize="words"
                />
              </View>

              <View style={{ flex: 1 }}>
                <AppInput
                  label={t("auth.lastName")}
                  value={form.lastName}
                  onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))}
                  placeholder="Doe"
                  autoCapitalize="words"
                />
              </View>
            </HStack>

            <AppInput
              label={t("profile.fields.phone")}
              value={form.phone}
              onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
              placeholder="+1 …"
              keyboardType="phone-pad"
            />

            <Divider opacity={0.6} />

            {/* Body metrics */}
            <Text variant="caption" muted>
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
            <VStack style={{ gap: theme.spacing.sm }}>
              <Text variant="caption" style={{ opacity: 0.9 }}>
                {t("profile.fields.birthDate")}
              </Text>

              <Button
                variant="secondary"
                onPress={() => setShowDatePicker(true)}
                contentStyle={{ justifyContent: "flex-start" }}
              >
                <Text
                  color={
                    form.birthDate
                      ? theme.colors.text
                      : "rgba(255,255,255,0.45)"
                  }
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
              onChange={(v) => setForm((p) => ({ ...p, nationality: v ?? "" }))}
              placeholder={t("common.selectPlaceholder")}
              options={nationalityOptions}
              searchable
              searchPlaceholder={t("common.search")}
            />

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
                  onChangeText={(v) => setForm((p) => ({ ...p, weightLb: v }))}
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

            <Divider opacity={0.6} />

            {/* Preferences */}
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
                dispatch(profileActions.setUnitSystem(next));

                setForm((p) => {
                  if (next === "imperial") {
                    const cm = toNumberOrNull(p.heightCm);
                    const kg = toNumberOrNull(p.weightKg);
                    const ftIn =
                      cm !== null ? cmToFeetInches(cm) : { ft: 0, inches: 0 };
                    const lb = kg !== null ? kgToLb(kg) : null;
                    return {
                      ...p,
                      unitSystem: next,
                      heightFt: cm !== null ? String(ftIn.ft) : "",
                      heightIn: cm !== null ? String(ftIn.inches) : "",
                      weightLb: lb !== null ? String(Math.round(lb)) : "",
                    };
                  }

                  // next === metric
                  const ft = toNumberOrNull(p.heightFt) ?? 0;
                  const inches = toNumberOrNull(p.heightIn) ?? 0;
                  const lb = toNumberOrNull(p.weightLb);
                  const cm = feetInchesToCm(ft, inches);
                  const kg = lb !== null ? lbToKg(lb) : null;
                  return {
                    ...p,
                    unitSystem: next,
                    heightCm:
                      p.heightFt || p.heightIn
                        ? String(Math.round(cm))
                        : p.heightCm,
                    weightKg:
                      lb !== null ? String(Math.round(kg ?? 0)) : p.weightKg,
                  };
                });
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

            {saveError ? (
              <Text color={theme.colors.accent2}>{saveError}</Text>
            ) : null}

            <Button
              isLoading={saving || isLoading}
              onPress={() => void onSave()}
            >
              {t("profile.actions.saveChanges")}
            </Button>

            <Button
              variant="secondary"
              isLoading={signingOut}
              onPress={() => void onSignOut()}
            >
              {t("profile.actions.signOut")}
            </Button>
          </VStack>
        </Card>
      </VStack>
    </KeyboardScreen>
  );
}
