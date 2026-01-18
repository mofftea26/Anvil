import { useCallback, useEffect, useMemo, useState } from "react";

import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import {
  useUpdateMyUserRowMutation,
  useUpsertTrainerProfileMutation,
} from "@/features/profile/api/profileApiSlice";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { supabase } from "@/shared/supabase/client";
import { uriToUint8ArrayJpeg } from "@/shared/supabase/imageUpload";
import { appToast, useAppAlert, useStickyHeaderHeight, useTheme } from "@/shared/ui";

type TrainerProfileForm = {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  phone: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  bio: string;
  certifications: string[];
  instagram: string;
  website: string;
};

const isHexColor = (value: string) => {
  const s = value.trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
};

const parseCerts = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
};

const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "").trim();
  const hasAlpha = h.length === 8;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const finalA = Math.max(0, Math.min(1, alpha * a));
  return `rgba(${r},${g},${b},${finalA})`;
};

export const useTrainerProfile = () => {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const headerHeight = useStickyHeaderHeight();
  const { me, trainerProfile, isLoading, error, refetch } = useMyProfile();
  const auth = useAppSelector((s) => s.auth);
  const { isBusy: signingOut, doSignOut } = useAuthActions();
  const [updateMyUserRow] = useUpdateMyUserRowMutation();
  const [upsertTrainerProfile] = useUpsertTrainerProfileMutation();

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [clearingAvatar, setClearingAvatar] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certDraft, setCertDraft] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const initial = useMemo<TrainerProfileForm>(
    () => ({
      firstName: me?.firstName ?? "",
      lastName: me?.lastName ?? "",
      avatarUrl: me?.avatarUrl ?? "",
      phone: trainerProfile?.phone ?? "",
      brandName: trainerProfile?.brandName ?? "",
      primaryColor: trainerProfile?.primaryColor ?? "",
      secondaryColor: trainerProfile?.secondaryColor ?? "",
      logoUrl: trainerProfile?.logoUrl ?? "",
      bio: trainerProfile?.bio ?? "",
      certifications: parseCerts(trainerProfile?.certifications),
      instagram: trainerProfile?.instagram ?? "",
      website: trainerProfile?.website ?? "",
    }),
    [me, trainerProfile]
  );

  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const updateField = useCallback(
    <K extends keyof TrainerProfileForm>(key: K, value: TrainerProfileForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const pickAndUploadAvatar = useCallback(async () => {
    if (!auth.userId) return;
    try {
      setUploadingAvatar(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as ImagePicker.MediaType[],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      const { bytes, contentType } = await uriToUint8ArrayJpeg(uri);
      const path = `${auth.userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, bytes, { upsert: true, contentType });

      if (uploadError) {
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

      updateField("avatarUrl", publicUrl);
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
    } finally {
      setUploadingAvatar(false);
    }
  }, [auth.userId, refetch, t, updateField, updateMyUserRow]);

  const clearAvatar = useCallback(async () => {
    if (!auth.userId) return;
    try {
      setClearingAvatar(true);
      await updateMyUserRow({
        userId: auth.userId,
        payload: { avatarUrl: null },
      }).unwrap();
      updateField("avatarUrl", "");
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
    } finally {
      setClearingAvatar(false);
    }
  }, [auth.userId, refetch, t, updateField, updateMyUserRow]);

  const pickAndUploadBrandLogo = useCallback(async () => {
    if (!auth.userId) return;
    try {
      setUploadingLogo(true);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as ImagePicker.MediaType[],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      const { bytes, contentType } = await uriToUint8ArrayJpeg(uri);
      const path = `${auth.userId}/logo.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, bytes, { upsert: true, contentType });

      if (uploadError) {
        console.log("UPLOAD ERROR FULL:", uploadError);
        appToast.error(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      updateField("logoUrl", publicUrl);
      await upsertTrainerProfile({
        userId: auth.userId,
        payload: { logoUrl: publicUrl },
      }).unwrap();
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (err: any) {
      appToast.error(err?.message ?? t("auth.errors.generic"));
    } finally {
      setUploadingLogo(false);
    }
  }, [auth.userId, refetch, t, updateField, upsertTrainerProfile]);

  const onSave = useCallback(async () => {
    if (!auth.userId || !me) return;

    setSaving(true);
    setSaveError(null);

    try {
      if (form.primaryColor.trim() && !isHexColor(form.primaryColor)) {
        throw new Error(
          `${t("profile.fields.primaryColor")}: invalid HEX (e.g. #A3FF12)`
        );
      }
      if (form.secondaryColor.trim() && !isHexColor(form.secondaryColor)) {
        throw new Error(
          `${t("profile.fields.secondaryColor")}: invalid HEX (e.g. #22D3EE)`
        );
      }

      await updateMyUserRow({
        userId: auth.userId,
        payload: {
          firstName: form.firstName.trim() || null,
          lastName: form.lastName.trim() || null,
        },
      }).unwrap();

      await upsertTrainerProfile({
        userId: auth.userId,
        payload: {
          phone: form.phone.trim() || null,
          brandName: form.brandName.trim() || null,
          primaryColor: form.primaryColor.trim() || null,
          secondaryColor: form.secondaryColor.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
          bio: form.bio.trim() || null,
          certifications: form.certifications.length
            ? form.certifications.join(", ")
            : null,
          instagram: form.instagram.trim() || null,
          website: form.website.trim() || null,
        },
      }).unwrap();

      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (err: any) {
      setSaveError(err?.message ?? t("profile.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [
    auth.userId,
    form,
    me,
    refetch,
    t,
    updateMyUserRow,
    upsertTrainerProfile,
  ]);

  const onSignOut = useCallback(async () => {
    await doSignOut();
    appToast.info(t("auth.toasts.signedOut"));
    router.replace("/");
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

  const onPressClearAvatar = useCallback(() => {
    alert.confirm({
      title: t("profile.actions.clearPhoto"),
      message: t("common.areYouSure"),
      confirmText: t("common.clear"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: async () => {
        await clearAvatar();
      },
    });
  }, [alert, clearAvatar, t]);

  const startAddCertification = useCallback(() => {
    setCertDraft("");
    setCertModalOpen(true);
  }, []);

  const cancelAddCertification = useCallback(() => {
    setCertModalOpen(false);
  }, []);

  const removeCertification = useCallback(
    (cert: string) => {
      alert.confirm({
        title: t("profile.certifications.deleteTitle"),
        message: cert,
        confirmText: t("common.delete"),
        cancelText: t("common.cancel"),
        destructive: true,
        onConfirm: () => {
          setForm((prev) => ({
            ...prev,
            certifications: prev.certifications.filter((x) => x !== cert),
          }));
        },
      });
    },
    [alert, t]
  );

  const addCertification = useCallback(() => {
    const next = certDraft.trim();
    if (!next) return;
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(next)
        ? prev.certifications
        : [...prev.certifications, next],
    }));
    setCertModalOpen(false);
  }, [certDraft]);

  const brandA = theme.colors.accent;
  const brandB = theme.colors.accent2;
  const headerGradient = [
    hexToRgba(brandA, 0.45),
    hexToRgba(brandB, 0.3),
    "rgba(0,0,0,0.00)",
  ];
  const brandCardGradient = [
    hexToRgba(brandA, 0.2),
    hexToRgba(brandB, 0.1),
    "rgba(255,255,255,0.00)",
  ];
  const logoPlaceholderGradient = [
    hexToRgba(brandA, 0.18),
    hexToRgba(brandB, 0.1),
    "rgba(255,255,255,0.00)",
  ];

  return {
    t,
    theme,
    headerHeight,
    me,
    auth,
    isLoading,
    error,
    form,
    saving,
    saveError,
    signingOut,
    uploadingAvatar,
    clearingAvatar,
    uploadingLogo,
    certModalOpen,
    certDraft,
    refreshing,
    brandA,
    brandB,
    headerGradient,
    brandCardGradient,
    logoPlaceholderGradient,
    updateField,
    setCertDraft,
    onRefresh,
    onPressSave,
    onPressSignOut,
    onPressClearAvatar,
    onPickAvatar: pickAndUploadAvatar,
    onPickLogo: pickAndUploadBrandLogo,
    onClearLogo: () => updateField("logoUrl", ""),
    onStartAddCert: startAddCertification,
    onCancelAddCert: cancelAddCertification,
    onRemoveCert: removeCertification,
    onAddCert: addCertification,
  };
};
