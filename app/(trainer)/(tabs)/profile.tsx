import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";

import { useAuthActions } from "../../../src/features/auth/hooks/useAuthActions";
import {
  useUpdateMyUserRowMutation,
  useUpsertTrainerProfileMutation,
} from "../../../src/features/profile/api/profileApiSlice";
import { useMyProfile } from "../../../src/features/profile/hooks/useMyProfile";
import { AppInput } from "../../../src/shared/components/AppInput";
import { KeyboardScreen } from "../../../src/shared/components/KeyboardScreen";
import { useAppSelector } from "../../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import { supabase } from "../../../src/shared/supabase/client";
import { uriToUint8ArrayJpeg } from "../../../src/shared/supabase/imageUpload";
import {
  appToast,
  Button,
  Card,
  Chip,
  ColorPickerField,
  Divider,
  HStack,
  ProfileAccountCard,
  Text,
  useAppAlert,
  useTheme,
  VStack,
} from "../../../src/shared/ui";

function isHexColor(v: string) {
  const s = v.trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
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

function parseCerts(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function TrainerProfileScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const { me, trainerProfile, isLoading, error, refetch } = useMyProfile();
  const auth = useAppSelector((s) => s.auth);
  const { isBusy: signingOut, doSignOut } = useAuthActions();
  const [updateMyUserRow] = useUpdateMyUserRowMutation();
  const [upsertTrainerProfile] = useUpsertTrainerProfileMutation();

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certDraft, setCertDraft] = useState("");
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const initial = useMemo(() => {
    return {
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
    };
  }, [me, trainerProfile]);

  const [form, setForm] = useState(initial);

  // keep form in sync when profile loads
  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  const pickAndUploadAvatar = async () => {
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

      setForm((p) => ({ ...p, avatarUrl: publicUrl }));
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const pickAndUploadBrandLogo = async () => {
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

      setForm((p) => ({ ...p, logoUrl: publicUrl }));
      // Persist immediately so the brand is available globally.
      await upsertTrainerProfile({
        userId: auth.userId,
        payload: { logoUrl: publicUrl },
      }).unwrap();
      await refetch();
      appToast.success(t("profile.toasts.saved"));
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSave = async () => {
    if (!auth.userId || !me) return;

    setSaving(true);
    setSaveError(null);

    try {
      // simple validation for colors if provided
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

      // Update identity fields
      await updateMyUserRow({
        userId: auth.userId,
        payload: {
          firstName: form.firstName.trim() || null,
          lastName: form.lastName.trim() || null,
        },
      }).unwrap();

      // Upsert trainer profile (DB uses userId)
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
    } catch (e: any) {
      setSaveError(e?.message ?? t("profile.errors.saveFailed"));
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

  const brandA = theme.colors.accent;
  const brandB = theme.colors.accent2;

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

      <KeyboardScreen
        padding={12}
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
          <Text variant="title" weight="bold">
            {t("tabs.profile")}
          </Text>

          {error ? <Text color={theme.colors.danger}>{error}</Text> : null}

          <ProfileAccountCard
            title={t("profile.sections.account")}
            firstName={form.firstName}
            lastName={form.lastName}
            email={me?.email ?? ""}
            avatarUrl={form.avatarUrl}
            seed={auth.userId || me?.email || "seed"}
            onPressAvatar={() => void pickAndUploadAvatar()}
            disabled={uploadingAvatar}
          />

          {/* Trainer */}
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
                    variant="secondary"
                    height={40}
                    onPress={() => {
                      setCertDraft("");
                      setCertModalOpen(true);
                    }}
                  >
                    + {t("common.add")}
                  </Button>
                </HStack>

                {form.certifications.length ? (
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}
                  >
                    {form.certifications.map((c) => (
                      <Chip
                        key={c}
                        label={c}
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
                                certifications: p.certifications.filter(
                                  (x) => x !== c
                                ),
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

                {certModalOpen ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radii.lg,
                      backgroundColor: theme.colors.surface,
                      padding: 12,
                      gap: 10,
                    }}
                  >
                    <AppInput
                      label={t("profile.certifications.addLabel")}
                      value={certDraft}
                      onChangeText={setCertDraft}
                      placeholder={t("profile.placeholders.certifications")}
                      autoCapitalize="words"
                    />
                    <HStack gap={10}>
                      <Button
                        variant="secondary"
                        fullWidth
                        style={{ flex: 1 }}
                        onPress={() => setCertModalOpen(false)}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        fullWidth
                        style={{ flex: 1 }}
                        onPress={() => {
                          const next = certDraft.trim();
                          if (!next) return;
                          setForm((p) => ({
                            ...p,
                            certifications: p.certifications.includes(next)
                              ? p.certifications
                              : [...p.certifications, next],
                          }));
                          setCertModalOpen(false);
                        }}
                      >
                        {t("common.add")}
                      </Button>
                    </HStack>
                  </View>
                ) : null}
              </VStack>

              <AppInput
                label={t("profile.fields.instagram")}
                value={form.instagram}
                onChangeText={(v) => setForm((p) => ({ ...p, instagram: v }))}
                placeholder="@yourhandle"
                autoCapitalize="none"
              />

              <AppInput
                label={t("profile.fields.website")}
                value={form.website}
                onChangeText={(v) => setForm((p) => ({ ...p, website: v }))}
                placeholder="https://…"
                autoCapitalize="none"
              />

              {saveError ? (
                <Text color={theme.colors.danger}>{saveError}</Text>
              ) : null}

              <Button isLoading={saving || isLoading} onPress={onPressSave}>
                {t("common.save")}
              </Button>
            </VStack>
          </Card>

          {/* Brand management */}
          <Card padded={false} style={{ overflow: "hidden" }}>
            <LinearGradient
              colors={[
                hexToRgba(brandA, 0.2),
                hexToRgba(brandB, 0.1),
                "rgba(255,255,255,0.00)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <VStack
              style={{ gap: theme.spacing.lg, padding: theme.spacing.lg }}
            >
              <Text variant="caption" muted>
                {t("profile.sections.brandManagement")}
              </Text>

              <AppInput
                label={t("profile.fields.brandName")}
                value={form.brandName}
                onChangeText={(v) => setForm((p) => ({ ...p, brandName: v }))}
                placeholder="Anvil Coaching"
              />

              <HStack gap={theme.spacing.md} align="flex-end">
                <View style={{ flex: 1 }}>
                  <ColorPickerField
                    label={t("profile.fields.primaryColor")}
                    value={form.primaryColor}
                    onChange={(hex) =>
                      setForm((p) => ({ ...p, primaryColor: hex }))
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ColorPickerField
                    label={t("profile.fields.secondaryColor")}
                    value={form.secondaryColor}
                    onChange={(hex) =>
                      setForm((p) => ({ ...p, secondaryColor: hex }))
                    }
                  />
                </View>
              </HStack>

              <HStack gap={theme.spacing.md} align="center">
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor:
                      form.primaryColor.trim() && isHexColor(form.primaryColor)
                        ? form.primaryColor.trim()
                        : theme.colors.surface2,
                  }}
                />
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor:
                      form.secondaryColor.trim() &&
                      isHexColor(form.secondaryColor)
                        ? form.secondaryColor.trim()
                        : theme.colors.surface2,
                  }}
                />
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <Text variant="caption" muted>
                    {t("common.preview")}
                  </Text>
                </View>
              </HStack>

              <Divider opacity={0.6} />

              <Card background="surface2">
                <VStack style={{ gap: 10 }}>
                  <Text variant="caption" style={{ opacity: 0.9 }}>
                    {t("profile.fields.logoUrl")}
                  </Text>

                  <HStack align="center" justify="space-between" gap={12}>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {form.logoUrl ? (
                        <Image
                          source={{ uri: form.logoUrl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <Ionicons
                          name="image-outline"
                          size={20}
                          color={theme.colors.textMuted}
                        />
                      )}
                    </View>

                    <VStack style={{ flex: 1, gap: 6 }}>
                      <Text weight="bold" numberOfLines={1}>
                        {form.brandName?.trim() ||
                          t("profile.fields.brandName")}
                      </Text>
                      <Text muted numberOfLines={1}>
                        {form.logoUrl ? form.logoUrl : t("common.chooseFile")}
                      </Text>
                    </VStack>

                    <Button
                      variant="secondary"
                      height={42}
                      isLoading={uploadingLogo}
                      onPress={() => void pickAndUploadBrandLogo()}
                      left={
                        <Ionicons
                          name="cloud-upload-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                      }
                    >
                      {uploadingLogo
                        ? t("account.uploading")
                        : t("common.change")}
                    </Button>
                  </HStack>

                  {form.logoUrl ? (
                    <Button
                      variant="ghost"
                      height={40}
                      onPress={() => setForm((p) => ({ ...p, logoUrl: "" }))}
                    >
                      {t("common.clear")}
                    </Button>
                  ) : null}
                </VStack>
              </Card>
            </VStack>
          </Card>

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
