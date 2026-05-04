import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { hexToRgba } from "@/features/linking/utils/coachFormatting";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  HStack,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

import { CoachAvatar } from "./CoachAvatar";

type CoachDetails = {
  trainer?: {
    id?: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  } | null;
  trainerProfile?: {
    brandName?: string | null;
    bio?: string | null;
    logoUrl?: string | null;
    phone?: string | null;
  } | null;
} | null;

type ClientCoachCardProps = {
  data: CoachDetails;
  coachName: string;
  nextCheckIn: string;
  relationshipStatus: string;
  brandA: string;
  brandB: string;
  onPause: () => void;
  onResume: () => void;
  onDisconnect: () => void;
  isPauseResumeLoading: boolean;
  isDisconnectLoading: boolean;
};

export function ClientCoachCard({
  data,
  coachName,
  nextCheckIn,
  relationshipStatus,
  brandA,
  brandB,
  onPause,
  onResume,
  onDisconnect,
  isPauseResumeLoading,
  isDisconnectLoading,
}: ClientCoachCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  if (!data) return null;

  const seed = data.trainer?.id || data.trainer?.email || "seed";
  const statusLabel = t(`linking.management.status.${relationshipStatus}`);
  const brandName = data.trainerProfile?.brandName?.trim();
  const headlineName = brandName && brandName.length > 0 ? brandName : coachName;

  return (
    <Card
      padded={false}
      bordered
      style={{
        overflow: "hidden",
        borderColor: hexToRgba(brandA, 0.22),
        backgroundColor: theme.colors.surface2,
      }}
    >
      <View style={{ position: "relative" }}>
        {data.trainerProfile?.logoUrl ? (
          <Image
            source={{ uri: data.trainerProfile.logoUrl }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              opacity: 0.22,
            }}
            contentFit="cover"
            cachePolicy="none"
            transition={1000}
          />
        ) : null}
        <LinearGradient
          colors={[
            hexToRgba(brandA, 0.5),
            hexToRgba(brandB, 0.34),
            "rgba(0,0,0,0.12)",
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
              <CoachAvatar
                avatarUrl={data.trainer?.avatarUrl}
                firstName={data.trainer?.firstName}
                lastName={data.trainer?.lastName}
                seed={seed}
              />
              <VStack style={{ flex: 1, gap: 4 }}>
                <Text weight="bold" style={{ fontSize: 20 }} numberOfLines={1}>
                  {headlineName}
                </Text>
                <Text muted numberOfLines={1}>
                  {coachName}
                </Text>
              </VStack>
            </HStack>

            <VStack
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: hexToRgba(brandA, 0.2),
                borderWidth: 1,
                borderColor: hexToRgba(brandA, 0.35),
              }}
            >
              <Text variant="caption" style={{ color: theme.colors.text }}>
                {statusLabel}
              </Text>
            </VStack>
          </HStack>

          <HStack gap={10}>
            <Card background="surface" bordered style={{ flex: 1 }}>
              <VStack style={{ gap: 6 }}>
                <Text variant="caption" muted>
                  {t("linking.coach.checkIn")}
                </Text>
                <Text weight="bold" style={{ fontSize: 16 }}>
                  {nextCheckIn}
                </Text>
                <Text variant="caption" muted>
                  {t("linking.coach.subtitle")}
                </Text>
              </VStack>
            </Card>
          </HStack>

          {data.trainerProfile?.bio ? (
            <Text muted numberOfLines={5} style={{ lineHeight: 20 }}>
              {data.trainerProfile.bio}
            </Text>
          ) : null}

          <Card background="surface" bordered>
            <VStack style={{ gap: 10 }}>
              <Text variant="caption" muted>
                {t("linking.coach.contact")}
              </Text>
              <HStack align="center" justify="space-between">
                <Text muted>{t("auth.email")}</Text>
                <Text style={{ maxWidth: "65%", textAlign: "right" }}>
                  {data.trainer?.email ?? "—"}
                </Text>
              </HStack>
              <HStack align="center" justify="space-between">
                <Text muted>{t("profile.fields.phone")}</Text>
                <Text style={{ maxWidth: "65%", textAlign: "right" }}>
                  {data.trainerProfile?.phone ?? "—"}
                </Text>
              </HStack>
            </VStack>
          </Card>

          <HStack gap={10}>
            {relationshipStatus === "paused" ? (
              <Button
                fullWidth
                style={{ flex: 1 }}
                isLoading={isPauseResumeLoading}
                onPress={onResume}
              >
                {t("linking.coach.resume")}
              </Button>
            ) : (
              <Button
                fullWidth
                style={{ flex: 1 }}
                isLoading={isPauseResumeLoading}
                onPress={onPause}
              >
                {t("linking.coach.pause")}
              </Button>
            )}

            <Button
              variant="secondary"
              fullWidth
              style={{ flex: 1 }}
              isLoading={isDisconnectLoading}
              textStyle={{ color: theme.colors.danger }}
              onPress={onDisconnect}
            >
              {t("linking.coach.disconnect")}
            </Button>
          </HStack>
        </VStack>
      </View>
    </Card>
  );
}
