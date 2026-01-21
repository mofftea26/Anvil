import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import type { TrainerProfileForm } from "@/features/profile/hooks/trainer-profile/useTrainerProfile";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Card,
  ColorPickerField,
  Divider,
  HStack,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

type TrainerBrandCardProps = {
  form: Pick<
    TrainerProfileForm,
    "brandName" | "primaryColor" | "secondaryColor" | "logoUrl"
  >;
  setForm: React.Dispatch<React.SetStateAction<TrainerProfileForm>>;
  pickAndUploadBrandLogo: () => Promise<void>;
  isLogoUploading: boolean;
  logoProgress: number | null;
};

export function TrainerBrandCard({
  form,
  setForm,
  pickAndUploadBrandLogo,
  isLogoUploading,
  logoProgress,
}: TrainerBrandCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const brandA = theme.colors.accent;
  const brandB = theme.colors.accent2;

  return (
    <Card padded={false} style={{ overflow: "hidden" }}>
      <LinearGradient
        colors={[
          hexToRgba(brandA, 0.2),
          hexToRgba(brandB, 0.1),
          "rgba(0,0,0,0.00)",
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
      <VStack style={{ gap: theme.spacing.lg, padding: theme.spacing.lg }}>
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
              disabled={isLogoUploading}
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

            {isLogoUploading ? (
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
                  {logoProgress != null
                    ? `Uploading ${logoProgress}%`
                    : t("account.uploading")}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void pickAndUploadBrandLogo()}
              disabled={isLogoUploading}
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
                opacity: isLogoUploading ? 0.6 : pressed ? 0.85 : 1,
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
  );
}
