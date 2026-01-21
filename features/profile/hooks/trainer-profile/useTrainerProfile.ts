import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";

import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import {
  useUpdateMyUserRowMutation,
  useUpsertTrainerProfileMutation,
} from "@/features/profile/api/profileApiSlice";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import {
  hexToRgba,
  isHexColor,
  parseCerts,
} from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { pickAndPrepareSquareImage } from "@/shared/media/imageUpload";
import { useSupabaseImageUpload } from "@/shared/media/useSupabaseImageUpload";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { appToast, useAppAlert } from "@/shared/ui";

export type TrainerProfileForm = {
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

export function useTrainerProfile() {
  const { t } = useAppTranslation();
  const alert = useAppAlert();
  const { me, trainerProfile, isLoading, error, refetch } = useMyProfile();
  const auth = useAppSelector((s) => s.auth);
  const { isBusy: signingOut, doSignOut } = useAuthActions();
  const [updateMyUserRow] = useUpdateMyUserRowMutation();
  const [upsertTrainerProfile] = useUpsertTrainerProfileMutation();

  const [saving, setSaving] = useState(false);
  const [clearingAvatar, setClearingAvatar] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const avatarUpload = useSupabaseImageUpload();
  const logoUpload = useSupabaseImageUpload();

  const initial = useMemo(
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

  const [form, setForm] = useState<TrainerProfileForm>(initial);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

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

  const pickAndUploadBrandLogo = useCallback(async () => {
    if (!auth.userId) return;
    try {
      const prepared = await pickAndPrepareSquareImage();
      if (!prepared) return;
      const path = `${auth.userId}/logo.jpg`;
      const publicUrl = await logoUpload.uploadImage({
        bucket: "logos",
        path,
        fileUri: prepared.uri,
        contentType: prepared.mimeType,
        upsert: true,
      });
      setForm((p) => ({ ...p, logoUrl: `${publicUrl}?t=${Date.now()}` }));
      await upsertTrainerProfile({
        userId: auth.userId,
        payload: { logoUrl: publicUrl },
      }).unwrap();
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (e: unknown) {
      appToast.error((e as { message?: string })?.message ?? t("auth.errors.generic"));
    }
  }, [auth.userId, logoUpload, refetch, t, upsertTrainerProfile]);

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
    } catch (e: unknown) {
      setSaveError((e as { message?: string })?.message ?? t("profile.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [auth.userId, form, me, refetch, t, updateMyUserRow, upsertTrainerProfile]);

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

  return {
    me,
    auth,
    form,
    setForm,
    error,
    isLoading,
    refreshing,
    onRefresh,
    pickAndUploadAvatar,
    clearAvatar,
    isAvatarUploading: avatarUpload.uploading,
    avatarProgress: avatarUpload.progress,
    clearingAvatar,
    pickAndUploadBrandLogo,
    isLogoUploading: logoUpload.uploading,
    logoProgress: logoUpload.progress,
    saving,
    signingOut,
    saveError,
    onPressSave,
    onPressSignOut,
    hexToRgba,
  };
}
