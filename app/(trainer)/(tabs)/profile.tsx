import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, View } from "react-native";

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
import {
  appToast,
  Button,
  Card,
  Chip,
  ColorPickerField,
  Divider,
  HStack,
  ImagePickerField,
  Text,
  useTheme,
  VStack,
} from "../../../src/shared/ui";

function isHexColor(v: string) {
  const s = v.trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
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
  const { me, trainerProfile, isLoading, error, refetch } = useMyProfile();
  const auth = useAppSelector((s) => s.auth);
  const { isBusy: signingOut, doSignOut } = useAuthActions();
  const [updateMyUserRow] = useUpdateMyUserRowMutation();
  const [upsertTrainerProfile] = useUpsertTrainerProfileMutation();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certDraft, setCertDraft] = useState("");

  const initial = useMemo(() => {
    return {
      firstName: me?.firstName ?? "",
      lastName: me?.lastName ?? "",
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

  return (
    <KeyboardScreen padding={12}>
      <VStack
        style={{
          backgroundColor: theme.colors.background,
          gap: theme.spacing.lg,
        }}
      >
        <Text variant="title" weight="bold">
          {t("tabs.profile")}
        </Text>

        {error ? <Text color={theme.colors.accent2}>{error}</Text> : null}

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
              {t("trainer.profileCardRole")}: {me?.role ?? ""}
            </Text>
          </VStack>
        </Card>

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
              placeholder="+961 …"
              keyboardType="phone-pad"
            />

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

            <ImagePickerField
              label={t("profile.fields.logoUrl")}
              value={form.logoUrl}
              onChange={(uri) => setForm((p) => ({ ...p, logoUrl: uri }))}
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
                        Alert.alert(
                          t("profile.certifications.deleteTitle"),
                          c,
                          [
                            { text: t("common.cancel"), style: "cancel" },
                            {
                              text: t("common.delete"),
                              style: "destructive",
                              onPress: () =>
                                setForm((p) => ({
                                  ...p,
                                  certifications: p.certifications.filter(
                                    (x) => x !== c
                                  ),
                                })),
                            },
                          ]
                        );
                      }}
                    />
                  ))}
                </View>
              ) : (
                <Text muted>{t("profile.certifications.empty")}</Text>
              )}

              {/* inline modal for adding cert */}
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
              <Text color={theme.colors.accent2}>{saveError}</Text>
            ) : null}

            <Button
              isLoading={saving || isLoading}
              onPress={() => void onSave()}
            >
              {t("common.save")}
            </Button>
          </VStack>
        </Card>

        <Button
          variant="secondary"
          isLoading={signingOut}
          onPress={() => void onSignOut()}
        >
          {t("profile.actions.signOut")}
        </Button>
      </VStack>
    </KeyboardScreen>
  );
}
