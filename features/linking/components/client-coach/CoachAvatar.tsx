import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { View } from "react-native";

import {
  getInitials,
  pickAvatarBg,
} from "@/features/linking/utils/coachFormatting";
import { Text, useTheme } from "@/shared/ui";

type CoachAvatarProps = {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  seed: string;
};

export function CoachAvatar({
  avatarUrl,
  firstName,
  lastName,
  seed,
}: CoachAvatarProps) {
  const theme = useTheme();
  const initials = getInitials(firstName ?? "", lastName ?? "");
  const bg = pickAvatarBg(seed);
  const hasImage = Boolean(avatarUrl);

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: hasImage ? theme.colors.surface2 : bg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
      }}
    >
      {hasImage ? (
        <Image
          source={{ uri: avatarUrl! }}
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
  );
}
