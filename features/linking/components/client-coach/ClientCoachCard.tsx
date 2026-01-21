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

  return (
    <Card
      padded={false}
      style={{
        overflow: "hidden",
        borderColor: hexToRgba(brandA, 0.22),
        backgroundColor: "rgba(255,255,255,0.06)",
      }}
    >
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={[
            hexToRgba(brandA, 0.28),
            hexToRgba(brandB, 0.16),
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
                <Text variant="caption" muted>
                  {t("linking.coach.title")}
                </Text>
                <Text weight="bold" style={{ fontSize: 20 }} numberOfLines={1}>
                  {data.trainerProfile?.brandName ?? coachName}
                </Text>
                <Text muted numberOfLines={1}>
                  {coachName}
                </Text>
              </VStack>
            </HStack>

            {data.trainerProfile?.logoUrl ? (
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.10)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                <Image
                  source={{ uri: data.trainerProfile.logoUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="none"
                  transition={1000}
                />
              </View>
            ) : null}
          </HStack>

          {data.trainerProfile?.bio ? (
            <Text muted numberOfLines={5} style={{ lineHeight: 20 }}>
              {data.trainerProfile.bio}
            </Text>
          ) : null}

          <Card background="surface2">
            <HStack align="center" justify="space-between">
              <Text muted>{t("linking.coach.checkIn")}</Text>
              <Text weight="semibold">{nextCheckIn}</Text>
            </HStack>
          </Card>

          <Card background="surface2">
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
