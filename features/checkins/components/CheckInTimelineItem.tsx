import { Image } from "expo-image";
import React from "react";
import { View } from "react-native";

import type { TimelineItem } from "@/shared/ui/timeline/TimelineBoard";
import { HStack, Text, useTheme, VStack } from "@/shared/ui";

import type { TrainerCheckIn } from "../types";

type Props = {
  item: TimelineItem;
  row: TrainerCheckIn;
  liveTimeLabel: string;
};

export function CheckInTimelineItem(props: Props) {
  const theme = useTheme();
  const { row, liveTimeLabel, item } = props;

  const initials =
    [row.clientFirstName?.[0], row.clientLastName?.[0]].filter(Boolean).join("").toUpperCase() ||
    "?";

  return (
    <VStack style={{ gap: 6, paddingVertical: 2 }}>
      <HStack align="center" justify="space-between">
        <HStack align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              overflow: "hidden",
              backgroundColor: theme.colors.surface3,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            {row.clientAvatarUrl ? (
              <Image
                source={{ uri: row.clientAvatarUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Text weight="bold" style={{ fontSize: 10 }}>
                {initials}
              </Text>
            )}
          </View>
          <Text weight="semibold" numberOfLines={1} style={{ fontSize: 13, flex: 1 }}>
            {item.title}
          </Text>
        </HStack>
        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{liveTimeLabel}</Text>
      </HStack>
      {item.subtitle ? (
        <Text numberOfLines={2} style={{ color: theme.colors.textMuted, fontSize: 11 }}>
          {item.subtitle}
        </Text>
      ) : null}
      {item.statusLabel ? (
        <View
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.surface3,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: item.statusColor ?? theme.colors.textMuted,
            }}
          >
            {item.statusLabel}
          </Text>
        </View>
      ) : null}
    </VStack>
  );
}
