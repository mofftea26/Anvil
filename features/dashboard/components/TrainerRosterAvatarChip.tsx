import { Image } from "expo-image";
import React from "react";
import { Pressable, View } from "react-native";

import {
  pickAvatarBg,
} from "@/features/linking/utils/coachFormatting";
import { Icon, Text, useTheme } from "@/shared/ui";

type TrainerRosterAvatarChipProps = {
  name: string;
  seed: string;
  avatarUrl: string | null;
  initials: string | null;
  onPress: () => void;
  /** Default 56; use 52 on tight dashboard rows if needed */
  avatarSize?: number;
  /** Default 80 */
  columnWidth?: number;
};

export function TrainerRosterAvatarChip(props: TrainerRosterAvatarChipProps) {
  const theme = useTheme();
  const seedColor = pickAvatarBg(props.seed);
  const avatarSize = props.avatarSize ?? 56;
  const width = props.columnWidth ?? 80;
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.name}
      style={({ pressed }) => ({
        width,
        opacity: pressed ? 0.88 : 1,
        alignItems: "center",
        gap: 8,
      })}
    >
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: props.avatarUrl ? theme.colors.surface3 : seedColor,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        {props.avatarUrl ? (
          <Image
            source={{ uri: props.avatarUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />
        ) : props.initials ? (
          <Text
            weight="bold"
            style={{ color: "#fff", fontSize: Math.round(avatarSize * 0.32) }}
          >
            {props.initials}
          </Text>
        ) : (
          <Icon name="person" size={Math.round(avatarSize * 0.4)} color="#fff" />
        )}
      </View>
      <Text
        weight="semibold"
        numberOfLines={2}
        style={{ fontSize: 12, lineHeight: 15, textAlign: "center", width }}
      >
        {props.name}
      </Text>
    </Pressable>
  );
}
