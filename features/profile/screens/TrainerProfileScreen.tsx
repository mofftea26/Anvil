import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  View
} from "react-native";

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
import { AppInput } from "@/shared/components/AppInput";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { pickAndPrepareSquareImage } from "@/shared/media/imageUpload";
import { useSupabaseImageUpload } from "@/shared/media/useSupabaseImageUpload";
import {
  appToast,
  Button,
  Card,
  Chip,
  ColorPickerField,
  Divider,
  HStack,
  ProfileAccountCard,
  StickyHeader,
  Text,
  useAppAlert,
  useStickyHeaderHeight,
  useTheme,
  VStack,
} from "@/shared/ui";

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
  const [clearingAvatar, setClearingAvatar] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const avatarUpload = useSupabaseImageUpload();
  const logoUpload = useSupabaseImageUpload();

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

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  /* ------------------------------------------------------------------------ */
  /* Avatar Upload                                                            */
  /* ------------------------------------------------------------------------ */

  const pickAndUploadAvatar = async () => {
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
      
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
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

  /* ------------------------------------------------------------------------ */
  /* Brand Logo Upload                                                        */
  /* ------------------------------------------------------------------------ */

  const pickAndUploadBrandLogo = async () => {
    if (!auth.userId) return;

    try {
      const prepared = await pickAndPrepareSquareImage();
      if (!prepared) return;

      const brandId = auth.userId;
      const path = `${brandId}/logo.jpg`;

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
      
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
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
  const headerHeight = useStickyHeaderHeight({ subtitle: true });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.sm }}>
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

      <StickyHeader
        title={t("tabs.profile")}
        subtitle={t("trainer.profileSubtitle")}
        backgroundColor={theme.colors.background}
      />

      <KeyboardScreen
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
            disabled={avatarUpload.uploading || clearingAvatar}
            isUploading={avatarUpload.uploading}
            uploadLabel={
              avatarUpload.progress !== null
                ? `Uploading ${avatarUpload.progress}%`
                : "Uploading…"
            }
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
                    placeholder={t("common.placeholders.firstName")}
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
                    placeholder={t("common.placeholders.lastName")}
                    autoCapitalize="words"
                  />
                </View>
              </HStack>

              <AppInput
                label={t("profile.fields.phone")}
                value={form.phone}
                onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                placeholder={t("profile.placeholders.phone")}
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
                    variant="icon"
                    height={40}
                    onPress={() => {
                      alert.prompt({
                        title: t("profile.certifications.addLabel"),
                        label: t("profile.certifications.addLabel"),
                        placeholder: t("profile.placeholders.certifications"),
                        confirmText: t("common.add"),
                        cancelText: t("common.cancel"),
                        onConfirm: (value) => {
                          setForm((p) => ({
                            ...p,
                            certifications: p.certifications.includes(value)
                              ? p.certifications
                              : [...p.certifications, value],
                          }));
                        },
                      });
                    }}
                    left={<Ionicons name="add-circle-outline" size={22} color={theme.colors.text} />}
                  />
                </HStack>

                {form.certifications.length ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {form.certifications.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        isActive={false}
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
              </VStack>

              <AppInput
                label={t("profile.fields.instagram")}
                value={form.instagram}
                onChangeText={(v) => setForm((p) => ({ ...p, instagram: v }))}
                placeholder={t("profile.placeholders.instagram")}
                autoCapitalize="none"
              />

              <AppInput
                label={t("profile.fields.website")}
                value={form.website}
                onChangeText={(v) => setForm((p) => ({ ...p, website: v }))}
                placeholder={t("profile.placeholders.website")}
                autoCapitalize="none"
              />

              {saveError ? (
                <Text color={theme.colors.danger}>{saveError}</Text>
              ) : null}
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
                placeholder={t("profile.placeholders.brandName")}
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

              <Divider opacity={0.6} />

              <HStack align="center" justify="space-between">
                <Text variant="caption" style={{ opacity: 0.9 }}>
                  {t("profile.fields.logoUrl")}
                </Text>
                {form.logoUrl ? (
                  <Pressable
                    onPress={() => setForm((p) => ({ ...p, logoUrl: "" }))}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      paddingHorizontal: 6,
                      paddingVertical: 4,
                      borderRadius: 10,
                    })}
                  >
                    <Text variant="caption" style={{ opacity: 0.9 }}>
                      {t("common.clear")}
                    </Text>
                  </Pressable>
                ) : (
                  <View />
                )}
              </HStack>

              <Card
                padded={false}
                background="surface2"
                style={{ overflow: "hidden" }}
              >
                <View style={{ height: 170 }}>
                  {form.logoUrl ? (
                    <Image
                      source={{ uri: form.logoUrl }}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                      }}
                      contentFit="cover"
                      cachePolicy="none"
                      transition={1000}
                    />
                  ) : (
                    <LinearGradient
                      colors={[
                        hexToRgba(brandA, 0.18),
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
                  )}

                  <Pressable
                    onPress={() => void pickAndUploadBrandLogo()}
                    disabled={logoUpload.uploading}

                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 14,
                    }}
                  >
                    {!form.logoUrl ? (
                      <VStack style={{ gap: 8, alignItems: "center" }}>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={24}
                          color={theme.colors.textMuted}
                        />
                        <Text muted>{t("common.change")}</Text>
                      </VStack>
                    ) : null}
                  </Pressable>

                  {logoUpload.uploading ? (
  <View
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    }}
    pointerEvents="none"
  >
    <ActivityIndicator />
    <Text weight="bold" style={{ color: "white" }}>
      {logoUpload.progress !== null
        ? `Uploading ${logoUpload.progress}%`
        : t("account.uploading")}
    </Text>
  </View>
) : null}


                  {/* Edit icon */}
                  <Pressable
                    onPress={() => void pickAndUploadBrandLogo()}
                    disabled={logoUpload.uploading}
                    style={({ pressed }) => ({
                      position: "absolute",
                      right: 10,
                      top: 10,
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.14)",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity:
                        logoUpload.uploading ? 0.6 : pressed ? 0.85 : 1,
                    })}
                  >
                    <Ionicons name="pencil" size={16} color="white" />
                  </Pressable>

                  {/* Brand name overlay */}
                  <View
                    style={{
                      position: "absolute",
                      left: 12,
                      bottom: 12,
                      right: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 14,
                      backgroundColor: "rgba(0,0,0,0.35)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.10)",
                    }}
                    pointerEvents="none"
                  >
                    <Text
                      weight="bold"
                      numberOfLines={1}
                      style={{ color: "white" }}
                    >
                      {form.brandName?.trim() || t("profile.fields.brandName")}
                    </Text>
                  </View>
                </View>
              </Card>
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
