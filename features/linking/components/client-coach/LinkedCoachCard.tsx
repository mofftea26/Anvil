import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, View } from "react-native";

import { hexToRgba } from "@/features/linking/utils/coachFormatting";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

export type LinkedCoachCardProps = {
  /** First name of the linked coach. Falls back to localized "Coach" when empty/unlinked. */
  coachFirstName?: string | null;
  /** Whether the client has an active link to a trainer. */
  linked: boolean;
  /** Trainer brand logo (used as full-card background image with gradient overlay). */
  logoUrl?: string | null;
  /** Brand colors. Pass the trainer's branded colors when available; otherwise theme accents. */
  brandA: string;
  brandB: string;
  onPress: () => void;
  /** Optional accessibility override. */
  accessibilityLabel?: string;
};

/**
 * Reusable "linked coach" hero card for the client dashboard. Replaces the
 * previous StatChip + "Coach" ActionPill pair with a single tappable card
 * that emphasizes the trainer's brand (logo as a full-card cover image with
 * a dark gradient overlay for legibility) and a clear chevron CTA.
 *
 * Used by `ClientDashboardScreen` (Phase C) and any future surface that
 * needs the same compact "open linked coach" affordance.
 */
export function LinkedCoachCard(props: LinkedCoachCardProps) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const { coachFirstName, linked, logoUrl, brandA, brandB, onPress } = props;

  const headline = (() => {
    const trimmed = coachFirstName?.trim();
    if (linked && trimmed) return trimmed;
    if (linked) return t("client.dashboard.coach", "Coach");
    return t("client.dashboard.coachNotLinked", "Unlinked");
  })();

  const statusLabel = linked
    ? t("client.dashboard.coachLinked", "Linked")
    : t("client.dashboard.coachNotLinked", "Unlinked");

  const accentBorder = linked
    ? hexToRgba(brandA, 0.32)
    : theme.colors.border;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        props.accessibilityLabel ??
        t("client.dashboard.linkedCoachCta", "Open coach")
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <Card
        padded={false}
        bordered
        style={{
          overflow: "hidden",
          borderColor: accentBorder,
          backgroundColor: theme.colors.surface2,
        }}
      >
        <View style={{ position: "relative" }}>
          {linked && logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={300}
            />
          ) : null}
          <LinearGradient
            colors={
              linked
                ? [
                    hexToRgba(brandA, 0.62),
                    hexToRgba(brandB, 0.36),
                    "rgba(0,0,0,0.55)",
                  ]
                : [
                    "rgba(0,0,0,0.55)",
                    "rgba(0,0,0,0.35)",
                    "rgba(0,0,0,0.15)",
                  ]
            }
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

          <VStack style={{ padding: 14, gap: 8, minHeight: 96 }}>
            <HStack align="center" justify="space-between">
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: linked
                    ? hexToRgba(brandA, 0.22)
                    : hexToRgba(theme.colors.textMuted, 0.18),
                  borderWidth: 1,
                  borderColor: linked
                    ? hexToRgba(brandA, 0.42)
                    : hexToRgba(theme.colors.textMuted, 0.32),
                }}
              >
                <Text
                  variant="caption"
                  weight="semibold"
                  style={{
                    fontSize: 10,
                    letterSpacing: 0.6,
                    color: theme.colors.text,
                  }}
                >
                  {statusLabel.toUpperCase()}
                </Text>
              </View>
              <Icon
                name="chevron-forward"
                size={18}
                color={theme.colors.text}
                strokeWidth={2}
              />
            </HStack>

            <View style={{ flex: 1 }} />

            <VStack style={{ gap: 2 }}>
              <Text
                variant="caption"
                style={{
                  fontSize: 11,
                  letterSpacing: 0.4,
                  color: theme.colors.textMuted,
                }}
                numberOfLines={1}
              >
                {t("client.dashboard.coach", "Coach").toUpperCase()}
              </Text>
              <Text
                weight="bold"
                style={{ fontSize: 22, lineHeight: 26, color: theme.colors.text }}
                numberOfLines={1}
              >
                {headline}
              </Text>
            </VStack>
          </VStack>
        </View>
      </Card>
    </Pressable>
  );
}
