import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import {
  useUpdateMyUserRowMutation,
  useUpsertClientProfileMutation,
} from "@/features/profile/api/profileApiSlice";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { profileActions } from "@/features/profile/store/profileSlice";
import { formatDateISO } from "@/features/profile/utils/formatDate";
import {
  hexToRgba,
} from "@/features/profile/utils/trainerProfileUtils";
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
import { pickAndPrepareSquareImage } from "@/shared/media/imageUpload";
import { useSupabaseImageUpload } from "@/shared/media/useSupabaseImageUpload";
import { appToast, useAppAlert } from "@/shared/ui";

export type ClientProfileForm = {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  phone: string;
  nationality: string;
  gender: string;
  birthDate: string;
  heightCm: string;
  weightKg: string;
  heightFt: string;
  heightIn: string;
  weightLb: string;
  unitSystem: string;
  activityLevel: string;
  target: string;
  notes: string;
};

export function useClientProfile() {
  const { t } = useAppTranslation();
  const dispatch = useAppDispatch();
  const { me, clientProfile, isLoading, error, refetch } = useMyProfile();
  const auth = useAppSelector((s) => s.auth);
  const globalUnitSystem = useAppSelector((s) => s.profile.unitSystem);
  const { isBusy: signingOut, doSignOut } = useAuthActions();
  const [updateMyUserRow] = useUpdateMyUserRowMutation();
  const [upsertClientProfile] = useUpsertClientProfileMutation();
  const alert = useAppAlert();

  const [saving, setSaving] = useState(false);
  const [clearingAvatar, setClearingAvatar] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const avatarUpload = useSupabaseImageUpload();

  const buildFormFromProfile = useCallback(
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

  const [form, setForm] = useState<ClientProfileForm>(() => {
    const initialUnit = ((clientProfile?.unitSystem as UnitSystem | undefined) ??
      globalUnitSystem ??
      "metric") as UnitSystem;
    return buildFormFromProfile(initialUnit);
  });

  React.useEffect(() => {
    setForm((prev) =>
      buildFormFromProfile((prev.unitSystem as UnitSystem) || "metric")
    );
  }, [buildFormFromProfile]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

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
      { value: "sedentary", label: t("profile.activityLevel.sedentary"), description: t("profile.activityLevel.sedentaryDesc") },
      { value: "light", label: t("profile.activityLevel.light"), description: t("profile.activityLevel.lightDesc") },
      { value: "moderate", label: t("profile.activityLevel.moderate"), description: t("profile.activityLevel.moderateDesc") },
      { value: "active", label: t("profile.activityLevel.active"), description: t("profile.activityLevel.activeDesc") },
      { value: "athlete", label: t("profile.activityLevel.athlete"), description: t("profile.activityLevel.athleteDesc") },
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

  const onPickBirthDate = useCallback((date: Date) => {
    setForm((p) => ({ ...p, birthDate: formatDateISO(date) }));
  }, []);

  const onUnitChange = useCallback(
    (next: UnitSystem) => {
      dispatch(profileActions.setUnitSystem(next));
      setForm((p) => {
        if (next === "imperial") {
          const cm = toNumberOrNull(p.heightCm);
          const kg = toNumberOrNull(p.weightKg);
          const ftIn = cm !== null ? cmToFeetInches(cm) : { ft: 0, inches: 0 };
          const lb = kg !== null ? kgToLb(kg) : null;
          return {
            ...p,
            unitSystem: next,
            heightFt: cm !== null ? String(ftIn.ft) : "",
            heightIn: cm !== null ? String(ftIn.inches) : "",
            weightLb: lb !== null ? String(Math.round(lb)) : "",
          };
        }
        const ft = toNumberOrNull(p.heightFt) ?? 0;
        const inches = toNumberOrNull(p.heightIn) ?? 0;
        const lb = toNumberOrNull(p.weightLb);
        const cm = feetInchesToCm(ft, inches);
        const kg = lb !== null ? lbToKg(lb) : null;
        return {
          ...p,
          unitSystem: next,
          heightCm: p.heightFt || p.heightIn ? String(Math.round(cm)) : p.heightCm,
          weightKg: lb !== null ? String(Math.round(kg ?? 0)) : p.weightKg,
        };
      });
    },
    [dispatch]
  );

  const pickAndUploadAvatar = useCallback(async () => {
    if (!auth.userId) return;
    try {
      const path = `${auth.userId}/avatar.jpg`;
      const prepared = await pickAndPrepareSquareImage();
      if (!prepared) return;
      const publicUrl = await avatarUpload.uploadImage({
        bucket: "avatars",
        path,
        fileUri: prepared.uri,
        contentType: prepared.mimeType,
        upsert: true,
      });
      await updateMyUserRow({
        userId: auth.userId,
        payload: { avatarUrl: publicUrl },
      }).unwrap();
      setForm((p) => ({ ...p, avatarUrl: `${publicUrl}?t=${Date.now()}` }));
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (e: unknown) {
      appToast.error((e as { message?: string })?.message ?? t("auth.errors.generic"));
    }
  }, [auth.userId, avatarUpload, refetch, t, updateMyUserRow]);

  const clearAvatar = useCallback(async () => {
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
    } catch (e: unknown) {
      appToast.error((e as { message?: string })?.message ?? t("auth.errors.generic"));
    } finally {
      setClearingAvatar(false);
    }
  }, [auth.userId, refetch, t, updateMyUserRow]);

  const onSave = useCallback(async () => {
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
        throw new Error(`${t("profile.fields.heightCm")}: ${t("common.invalidNumber")}`);
      if (weight !== null && Number.isNaN(weight))
        throw new Error(`${t("profile.fields.weightKg")}: ${t("common.invalidNumber")}`);

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
    } catch (e: unknown) {
      setSaveError((e as { message?: string })?.message ?? t("auth.errors.generic"));
    } finally {
      setSaving(false);
    }
  }, [auth.userId, form, me, refetch, t, updateMyUserRow, upsertClientProfile]);

  const onSignOut = useCallback(async () => {
    await doSignOut();
    appToast.info(t("auth.toasts.signedOut"));
    router.replace("/" as any);
  }, [doSignOut, t]);

  const onPressSave = useCallback(() => {
    alert.confirm({
      title: t("common.save"),
      message: t("common.areYouSure"),
      confirmText: t("common.save"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        await onSave();
      },
    });
  }, [alert, onSave, t]);

  const onPressSignOut = useCallback(() => {
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
  }, [alert, onSignOut, t]);

  const dateValue = form.birthDate
    ? new Date(form.birthDate)
    : new Date(1995, 0, 1);

  return {
    me,
    auth,
    form,
    setForm,
    error,
    isLoading,
    refreshing,
    onRefresh,
    genderOptions,
    nationalityOptions,
    unitOptions,
    activityOptions,
    targetOptions,
    showDatePicker,
    setShowDatePicker,
    dateValue,
    onPickBirthDate,
    onUnitChange,
    pickAndUploadAvatar,
    clearAvatar,
    isAvatarUploading: avatarUpload.uploading,
    avatarProgress: avatarUpload.progress,
    clearingAvatar,
    saving,
    signingOut,
    saveError,
    onPressSave,
    onPressSignOut,
    hexToRgba,
  };
}
