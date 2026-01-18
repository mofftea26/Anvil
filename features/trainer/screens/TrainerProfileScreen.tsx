import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, RefreshControl, View } from "react-native";

import { useTrainerProfile } from "@/features/trainer/hooks/useTrainerProfile";
import { AppInput } from "@/shared/components/AppInput";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";
import {
  Button,
  Card,
  Chip,
  ColorPickerField,
  Divider,
  HStack,
  ProfileAccountCard,
  StickyHeader,
  Text,
  VStack,
} from "@/shared/ui";

export default function TrainerProfileScreen() {
  const {
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
    onPickAvatar,
    onPickLogo,
    onClearLogo,
    onStartAddCert,
    onCancelAddCert,
    onRemoveCert,
    onAddCert,
  } = useTrainerProfile();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
      />

      <StickyHeader
        title={t("tabs.profile")}
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
            onPressAvatar={() => void onPickAvatar()}
            onPressClear={onPressClearAvatar}
            clearLabel={t("profile.actions.clearPhoto")}
            disabled={uploadingAvatar || clearingAvatar}
          />

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
                    onChangeText={(v) => updateField("firstName", v)}
                    placeholder="John"
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label={t("auth.lastName")}
                    value={form.lastName}
                    onChangeText={(v) => updateField("lastName", v)}
                    placeholder="Doe"
                    autoCapitalize="words"
                  />
                </View>
              </HStack>

              <AppInput
                label={t("profile.fields.phone")}
                value={form.phone}
                onChangeText={(v) => updateField("phone", v)}
                placeholder="+961 …"
                keyboardType="phone-pad"
              />

              <AppInput
                label={t("profile.fields.bio")}
                value={form.bio}
                onChangeText={(v) => updateField("bio", v)}
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
                  <Button variant="secondary" height={40} onPress={onStartAddCert}>
                    + {t("common.add")}
                  </Button>
                </HStack>

                {form.certifications.length ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {form.certifications.map((cert) => (
                      <Chip
                        key={cert}
                        label={cert}
                        onPress={() => onRemoveCert(cert)}
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
                        onPress={onCancelAddCert}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button fullWidth style={{ flex: 1 }} onPress={onAddCert}>
                        {t("common.add")}
                      </Button>
                    </HStack>
                  </View>
                ) : null}
              </VStack>

              <AppInput
                label={t("profile.fields.instagram")}
                value={form.instagram}
                onChangeText={(v) => updateField("instagram", v)}
                placeholder="@yourhandle"
                autoCapitalize="none"
              />

              <AppInput
                label={t("profile.fields.website")}
                value={form.website}
                onChangeText={(v) => updateField("website", v)}
                placeholder="https://…"
                autoCapitalize="none"
              />

              {saveError ? (
                <Text color={theme.colors.danger}>{saveError}</Text>
              ) : null}
            </VStack>
          </Card>

          <Card padded={false} style={{ overflow: "hidden" }}>
            <LinearGradient
              colors={brandCardGradient}
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
            <VStack style={{ gap: theme.spacing.lg, padding: theme.spacing.lg }}>
              <Text variant="caption" muted>
                {t("profile.sections.brandManagement")}
              </Text>

              <AppInput
                label={t("profile.fields.brandName")}
                value={form.brandName}
                onChangeText={(v) => updateField("brandName", v)}
                placeholder="Anvil Coaching"
              />

              <HStack gap={theme.spacing.md} align="flex-end">
                <View style={{ flex: 1 }}>
                  <ColorPickerField
                    label={t("profile.fields.primaryColor")}
                    value={form.primaryColor}
                    onChange={(hex) => updateField("primaryColor", hex)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ColorPickerField
                    label={t("profile.fields.secondaryColor")}
                    value={form.secondaryColor}
                    onChange={(hex) => updateField("secondaryColor", hex)}
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
                    onPress={onClearLogo}
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

              <Card padded={false} background="surface2" style={{ overflow: "hidden" }}>
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
                    />
                  ) : (
                    <LinearGradient
                      colors={logoPlaceholderGradient}
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
                    onPress={() => void onPickLogo()}
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

                  {uploadingLogo ? (
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
                      }}
                      pointerEvents="none"
                    >
                      <Text weight="bold" style={{ color: "white" }}>
                        {t("account.uploading")}
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() => void onPickLogo()}
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
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Ionicons name="pencil" size={16} color="white" />
                  </Pressable>

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
                    <Text weight="bold" numberOfLines={1} style={{ color: "white" }}>
                      {form.brandName?.trim() || t("profile.fields.brandName")}
                    </Text>
                  </View>
                </View>
              </Card>
            </VStack>
          </Card>

          {saveError ? <Text color={theme.colors.danger}>{saveError}</Text> : null}

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
