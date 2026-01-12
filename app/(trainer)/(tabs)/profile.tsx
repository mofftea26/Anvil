import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Button, Card, Text, XStack, YStack } from "tamagui";

import { useAuthActions } from "../../../src/features/auth/hooks/useAuthActions";
import {
  updateMyUserRow,
  upsertTrainerProfile,
} from "../../../src/features/profile/api/profileApi";
import { useMyProfile } from "../../../src/features/profile/hooks/useMyProfile";
import { AppInput } from "../../../src/shared/components/AppInput";
import { KeyboardScreen } from "../../../src/shared/components/KeyboardScreen";
import { useAppSelector } from "../../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";

function isHexColor(v: string) {
  const s = v.trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

export default function TrainerProfileScreen() {
  const { t } = useAppTranslation();
  const { me, trainerProfile, isLoading, error, refetch } = useMyProfile();
  const auth = useAppSelector((s) => s.auth);
  const { isBusy: signingOut, doSignOut } = useAuthActions();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      certifications: trainerProfile?.certifications ?? "",
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
          `${t("profile.primaryColor")}: invalid HEX (e.g. #A3FF12)`
        );
      }
      if (form.secondaryColor.trim() && !isHexColor(form.secondaryColor)) {
        throw new Error(
          `${t("profile.secondaryColor")}: invalid HEX (e.g. #22D3EE)`
        );
      }

      // Update identity fields
      await updateMyUserRow(auth.userId, {
        userId: auth.userId,
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
      });

      // Upsert trainer profile (DB uses user_id)
      await upsertTrainerProfile(auth.userId, {
        userId: auth.userId,
        phone: form.phone.trim() || null,
        brandName: form.brandName.trim() || null,
        primaryColor: form.primaryColor.trim() || null,
        secondaryColor: form.secondaryColor.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        bio: form.bio.trim() || null,
        certifications: form.certifications.trim() || null,
        instagram: form.instagram.trim() || null,
        website: form.website.trim() || null,
      });

      await refetch();
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await doSignOut();
    router.replace("/");
  };

  return (
    <KeyboardScreen padding={20} bottomSpace={120}>
      <YStack
        backgroundColor="$background"
        gap="$4"
        padding="$6"
        paddingBottom="$10"
      >
        <Text fontSize={22} fontWeight="700">
          {t("profile.title")}
        </Text>

        {error ? <Text color="$accent2">{error}</Text> : null}

        <Card
          bordered
          borderColor="$borderColor"
          backgroundColor="$surface"
          borderRadius="$10"
          padding="$5"
        >
          <YStack gap="$2">
            <Text fontSize={13} opacity={0.75}>
              {t("profile.identity")}
            </Text>

            <Text fontSize={16} fontWeight="700">
              {(me?.firstName ?? "") + " " + (me?.lastName ?? "")}
            </Text>

            <Text opacity={0.75}>{me?.email ?? ""}</Text>

            <Text opacity={0.75}>
              {t("profile.role")}: {me?.role ?? ""}
            </Text>
          </YStack>
        </Card>

        <Card
          bordered
          borderColor="$borderColor"
          backgroundColor="$surface"
          borderRadius="$10"
          padding="$5"
        >
          <YStack gap="$4">
            <Text fontSize={13} opacity={0.75}>
              {t("profile.trainerSection")}
            </Text>

            <XStack gap="$3">
              <YStack flex={1}>
                <AppInput
                  label={t("onboarding.firstName")}
                  value={form.firstName}
                  onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))}
                  placeholder="John"
                  autoCapitalize="words"
                />
              </YStack>

              <YStack flex={1}>
                <AppInput
                  label={t("onboarding.lastName")}
                  value={form.lastName}
                  onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))}
                  placeholder="Doe"
                  autoCapitalize="words"
                />
              </YStack>
            </XStack>

            <AppInput
              label={t("profile.phone")}
              value={form.phone}
              onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
              placeholder="+961 …"
              keyboardType="phone-pad"
            />

            <AppInput
              label={t("profile.brandName")}
              value={form.brandName}
              onChangeText={(v) => setForm((p) => ({ ...p, brandName: v }))}
              placeholder="Anvil Coaching"
            />

            <XStack gap="$3" alignItems="flex-end">
              <YStack flex={1}>
                <AppInput
                  label={t("profile.primaryColor")}
                  value={form.primaryColor}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, primaryColor: v }))
                  }
                  placeholder="#A3FF12"
                  autoCapitalize="none"
                />
              </YStack>

              <YStack flex={1}>
                <AppInput
                  label={t("profile.secondaryColor")}
                  value={form.secondaryColor}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, secondaryColor: v }))
                  }
                  placeholder="#22D3EE"
                  autoCapitalize="none"
                />
              </YStack>
            </XStack>

            <XStack gap="$3">
              <YStack
                width={44}
                height={44}
                borderRadius={12}
                borderWidth={1}
                borderColor="$borderColor"
                backgroundColor={
                  form.primaryColor.trim() && isHexColor(form.primaryColor)
                    ? form.primaryColor.trim()
                    : "$surface2"
                }
              />
              <YStack
                width={44}
                height={44}
                borderRadius={12}
                borderWidth={1}
                borderColor="$borderColor"
                backgroundColor={
                  form.secondaryColor.trim() && isHexColor(form.secondaryColor)
                    ? form.secondaryColor.trim()
                    : "$surface2"
                }
              />
              <YStack flex={1} justifyContent="center">
                <Text opacity={0.7} fontSize={12}>
                  Preview
                </Text>
              </YStack>
            </XStack>

            <AppInput
              label={t("profile.logoUrl")}
              value={form.logoUrl}
              onChangeText={(v) => setForm((p) => ({ ...p, logoUrl: v }))}
              placeholder="https://…"
              autoCapitalize="none"
            />

            <AppInput
              label={t("profile.bio")}
              value={form.bio}
              onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
              placeholder="Short bio…"
              multiline
              numberOfLines={3}
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />

            <AppInput
              label={t("profile.certifications")}
              value={form.certifications}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, certifications: v }))
              }
              placeholder="IFBB, NASM…"
              multiline
              numberOfLines={2}
              style={{ minHeight: 70, textAlignVertical: "top" }}
            />

            <AppInput
              label={t("profile.instagram")}
              value={form.instagram}
              onChangeText={(v) => setForm((p) => ({ ...p, instagram: v }))}
              placeholder="@yourhandle"
              autoCapitalize="none"
            />

            <AppInput
              label={t("profile.website")}
              value={form.website}
              onChangeText={(v) => setForm((p) => ({ ...p, website: v }))}
              placeholder="https://…"
              autoCapitalize="none"
            />

            {saveError ? <Text color="$accent2">{saveError}</Text> : null}

            <Button
              height={50}
              borderRadius="$8"
              backgroundColor="$accent"
              color="$background"
              disabled={saving || isLoading}
              onPress={() => void onSave()}
            >
              {saving ? t("common.loading") : t("common.save")}
            </Button>
          </YStack>
        </Card>

        <Button
          height={48}
          borderRadius="$8"
          backgroundColor="$surface"
          borderColor="$borderColor"
          borderWidth={1}
          disabled={signingOut}
          onPress={() => void onSignOut()}
        >
          {signingOut ? t("common.loading") : t("profile.signOut")}
        </Button>
      </YStack>
    </KeyboardScreen>
  );
}
