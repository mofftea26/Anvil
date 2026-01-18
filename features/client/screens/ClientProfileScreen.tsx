import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, RefreshControl, View } from "react-native";

import { AppInput } from "@/shared/components/AppInput";
import { BottomSheetPicker } from "@/shared/components/BottomSheetPicker";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import {
  useUpdateMyUserRowMutation,
  useUpsertClientProfileMutation,
} from "@/features/profile/api/profileApiSlice";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { profileActions } from "@/features/profile/store/profileSlice";
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLb,
  lbToKg,
  toNumberOrNull,
  type UnitSystem,
} from "@/features/profile/utils/units";
import { countries } from "@/shared/constants/countries";
import { useAppDispatch } from "@/shared/hooks/useAppDispatch";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { supabase } from "@/shared/supabase/client";
import { uriToUint8ArrayJpeg } from "@/shared/supabase/imageUpload";
import {
  appToast,
  Button,
  Card,
  HStack,
  ProfileAccountCard,
  StickyHeader,
  Text,
  useAppAlert,
  useStickyHeaderHeight,
  useTheme,
  VStack,
} from "@/shared/ui";

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  const hasAlpha = h.length === 8;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const finalA = Math.max(0, Math.min(1, alpha * a));
  return `rgba(${r},${g},${b},${finalA})`;
}

export default function ClientProfileScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const { me, clientProfile, isLoading, error, refetch } = useMyProfile();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const globalUnitSystem = useAppSelector((s) => s.profile.unitSystem);
  const { isBusy: signingOut, doSignOut } = useAuthActions();
  const [updateMyUserRow] = useUpdateMyUserRowMutation();
  const [upsertClientProfile] = useUpsertClientProfileMutation();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clearingAvatar, setClearingAvatar] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const buildFormFromProfile = React.useCallback(
    (unitSystem: UnitSystem) => {
      const cm = clientProfile?.heightCm ?? null;
      const kg = clientProfile?.weightKg ?? null;
      const ftIn = cm !== null ? cmToFeetInches(cm) : null;
      const lb = kg !== null ? kgToLb(kg) : null;

      return {
        firstName: me?.firstName ?? "",
        lastName: me?.lastName ?? "",
        avatarUrl: me?.avatarUrl ?? "",
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

  const pickAndUploadAvatar = async () => {
    if (!auth.userId) return;
    try {
      setUploading(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as ImagePicker.MediaType[],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      const { bytes, contentType } = await uriToUint8ArrayJpeg(uri);
      // IMPORTANT: no "avatars/" prefix inside the "avatars" bucket.
      const path = `${auth.userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, bytes, { upsert: true, contentType });

      if (uploadError) {
        // Helps debug RLS 403 vs network errors.
        console.log("UPLOAD ERROR FULL:", uploadError);
        appToast.error(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      await updateMyUserRow({
        userId: auth.userId,
        payload: { avatarUrl: publicUrl },
      }).unwrap();

      setForm((p) => ({ ...p, avatarUrl: publicUrl }));
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    } finally {
      setUploading(false);
    }
  };

  const clearAvatar = async () => {
    if (!auth.userId) return;
    try {
      setClearingAvatar(true);
      await updateMyUserRow({
        userId: auth.userId,
        payload: { avatarUrl: null },
      }).unwrap();
      setForm((p) => ({ ...p, avatarUrl: "" }));
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    } finally {
      setClearingAvatar(false);
    }
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
          avatarUrl: form.avatarUrl || null,
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

  const onPressSave = () => {
    alert.confirm({
      title: t("common.save"),
      message: t("common.areYouSure"),
      confirmText: t("common.save"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        await onSave();
      },
    });
  };

  const onPressSignOut = () => {
    alert.confirm({
      title: t("profile.actions.signOut"),
      message: t("common.areYouSure"),
      confirmText: t("profile.actions.signOut"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        await onSignOut();
      },
    });
  };

  const dateValue = form.birthDate
    ? new Date(form.birthDate)
    : new Date(1995, 0, 1);

  const brandA = theme.colors.accent;
  const brandB = theme.colors.accent2;
  const headerHeight = useStickyHeaderHeight();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={[
          hexToRgba(brandA, 0.45),
          hexToRgba(brandB, 0.3),
          "rgba(0,0,0,0.00)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
      />

      <StickyHeader title={t("tabs.profile")} />

      <KeyboardScreen
        padding={12}
        bottomSpace={12}
        headerHeight={headerHeight}
        style={{ backgroundColor: "transparent" }}
        scrollStyle={{ backgroundColor: "transparent" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
      >
        <VStack style={{ gap: theme.spacing.lg }}>
          {error ? <Text color={theme.colors.danger}>{error}</Text> : null}

          <ProfileAccountCard
            title={t("profile.sections.account")}
            firstName={form.firstName}
            lastName={form.lastName}
            email={me?.email ?? ""}
            avatarUrl={form.avatarUrl}
            seed={auth.userId || me?.email || "seed"}
            onPressAvatar={() => void pickAndUploadAvatar()}
            onPressClear={() =>
              alert.confirm({
                title: t("profile.actions.clearPhoto"),
                message: t("common.areYouSure"),
                confirmText: t("common.clear"),
                cancelText: t("common.cancel"),
                destructive: true,
                onConfirm: async () => {
                  await clearAvatar();
                },
              })
            }
            clearLabel={t("profile.actions.clearPhoto")}
            disabled={uploading || clearingAvatar}
          />

          {/* Client info */}
          <Card>
            <VStack style={{ gap: theme.spacing.lg }}>
              <Text variant="caption" muted>
                {t("profile.sections.basic")}
              </Text>

              <HStack gap={theme.spacing.md}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label={t("auth.firstName")}
                    value={form.firstName}
                    onChangeText={(v) =>
                      setForm((p) => ({ ...p, firstName: v }))
                    }
                    placeholder="John"
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label={t("auth.lastName")}
                    value={form.lastName}
                    onChangeText={(v) =>
                      setForm((p) => ({ ...p, lastName: v }))
                    }
                    placeholder="Doe"
                    autoCapitalize="words"
                  />
                </View>
              </HStack>

              <AppInput
                label={t("profile.fields.phone")}
                value={form.phone}
                onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                placeholder="+961 …"
                keyboardType="phone-pad"
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

          {/* Body metrics */}
          <Card>
            <VStack style={{ gap: theme.spacing.lg }}>
              <Text variant="caption" muted>
                {t("profile.sections.body")}
              </Text>

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

          {/* Preferences */}
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
            </VStack>
          </Card>

          {saveError ? (
            <Text color={theme.colors.danger}>{saveError}</Text>
          ) : null}

          <Button isLoading={saving || isLoading} onPress={onPressSave}>
            {t("common.save")}
          </Button>

          <Button
            variant="secondary"
            isLoading={signingOut}
            onPress={onPressSignOut}
          >
            {t("profile.actions.signOut")}
          </Button>
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
