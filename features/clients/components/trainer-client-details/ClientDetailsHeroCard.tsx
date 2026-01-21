import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";

import { getInitials, pickAvatarBg } from "@/features/clients/utils/clientUi";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Divider, HStack, Text, VStack } from "@/shared/ui";

type ClientDetailsHeroCardProps = {
  clientUser: {
    id?: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  } | null;
  clientId: string;
  fullName: string;
  phone: string | null | undefined;
  isArchived: boolean;
  clientStatus: string;
  target: string | null | undefined;
};

export function ClientDetailsHeroCard({
  clientUser,
  clientId,
  fullName,
  phone,
  isArchived,
  clientStatus,
  target,
}: ClientDetailsHeroCardProps) {
  const { t } = useAppTranslation();

  const avatarUrl = clientUser?.avatarUrl ?? "";
  const hasImage = Boolean(avatarUrl);
  const initials = getInitials(clientUser?.firstName, clientUser?.lastName);
  const seed = clientUser?.id || clientUser?.email || clientId;
  const bg = pickAvatarBg(seed);

  return (
    <Card padded={false} style={{ overflow: "hidden" }}>
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.08)",
            "rgba(255,255,255,0.02)",
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

        <VStack style={{ gap: 12, padding: 14 }}>
          <HStack align="center" justify="space-between">
            <HStack align="center" gap={10} style={{ flex: 1 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: hasImage
                    ? "rgba(255,255,255,0.10)"
                    : bg,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                {hasImage ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    cachePolicy="none"
                    transition={1000}
                  />
                ) : initials ? (
                  <Text weight="bold" style={{ color: "white", fontSize: 14 }}>
                    {initials}
                  </Text>
                ) : (
                  <Ionicons name="person" size={20} color="white" />
                )}
              </View>

              <VStack style={{ flex: 1 }}>
                <Text weight="bold" style={{ fontSize: 18 }} numberOfLines={1}>
                  {fullName}
                </Text>
                <Text muted numberOfLines={1}>
                  {phone ?? "—"}
                </Text>
              </VStack>
            </HStack>

            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.10)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.14)",
              }}
            >
              <Text variant="caption">
                {isArchived
                  ? t("linking.clients.archived")
                  : t(`linking.management.status.${clientStatus}`)}
              </Text>
            </View>
          </HStack>

          <Divider opacity={0.35} />

          <HStack align="center" justify="space-between">
            <Text muted>{t("profile.fields.target")}</Text>
            <Text>{target ?? t("linking.clients.noTarget")}</Text>
          </HStack>
        </VStack>
      </View>
    </Card>
  );
}
