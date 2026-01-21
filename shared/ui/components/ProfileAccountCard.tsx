import { Image } from "expo-image";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { HStack, VStack } from "../layout/Stack";
import { useTheme } from "../theme";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { Text } from "./Text";

function getInitials(firstName: string, lastName: string): string | null {
  const a = (firstName ?? "").trim();
  const b = (lastName ?? "").trim();
  const s = `${a} ${b}`.trim();
  if (!s) return null;
  const parts = s.split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const initials = (first + second).toUpperCase();
  return initials || null;
}

function hashStringToInt(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickAvatarBg(seed: string): string {
  const palette = [
    "#7C3AED",
    "#38BDF8",
    "#22C55E",
    "#F97316",
    "#F43F5E",
    "#A855F7",
    "#06B6D4",
  ];
  const idx = hashStringToInt(seed) % palette.length;
  return palette[idx];
}

export function ProfileAccountCard({
  title,
  firstName,
  lastName,
  email,
  avatarUrl,
  seed,
  onPressAvatar,
  onPressClear,
  clearLabel,
  disabled,

  // NEW:
  isUploading,
  uploadLabel,
}: {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  seed: string;
  onPressAvatar: () => void;
  onPressClear?: () => void;
  clearLabel?: string;
  disabled?: boolean;

  // NEW:
  isUploading?: boolean;
  uploadLabel?: string;
}) {
  const theme = useTheme();
  const initials = getInitials(firstName, lastName);
  const bg = pickAvatarBg(seed);
  const hasImage = Boolean(avatarUrl);

  const isBusy = Boolean(disabled || isUploading);

  return (
    <Card>
      <VStack style={{ gap: theme.spacing.sm }}>
        <HStack align="center" justify="space-between">
          <Text variant="caption" muted>
            {title}
          </Text>

          {hasImage && onPressClear ? (
            <Pressable
              onPress={onPressClear}
              disabled={isBusy}
              style={({ pressed }) => ({
                opacity: isBusy ? 0.5 : pressed ? 0.8 : 1,
                paddingHorizontal: 6,
                paddingVertical: 4,
                borderRadius: 10,
              })}
            >
              <Text variant="caption" style={{ opacity: 0.9 }}>
                {clearLabel ?? "Clear"}
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
        </HStack>

        <HStack align="center" gap={12}>
          <Pressable
            onPress={onPressAvatar}
            style={{ position: "relative" }}
            disabled={isBusy}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: hasImage ? theme.colors.surface2 : bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {hasImage ? (
                <Image
                  source={{ uri: String(avatarUrl) }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="none"
                  transition={1000}
                />
              ) : initials ? (
                <Text
                  weight="bold"
                  style={{ color: "white", fontSize: 18, letterSpacing: 0.5 }}
                >
                  {initials}
                </Text>
              ) : (
                <Icon name="person" size={26} color="white" strokeWidth={1.5} />
              )}

              {/* NEW: spinner overlay */}
              {isUploading ? (
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
                  <ActivityIndicator />
                </View>
              ) : null}
            </View>

            {/* Edit icon */}
            <View
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "rgba(0,0,0,0.35)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.20)",
                alignItems: "center",
                justifyContent: "center",
                opacity: isBusy ? 0.6 : 1,
              }}
            >
              {isUploading ? (
                <Icon name="cloud-upload-outline" size={14} color="white" strokeWidth={1.5} />
              ) : (
                <Icon name="create-outline" size={14} color="white" strokeWidth={1.5} />
              )}
            </View>
          </Pressable>

          <VStack style={{ flex: 1 }}>
            <Text weight="bold" style={{ fontSize: 16 }}>
              {`${firstName ?? ""} ${lastName ?? ""}`.trim() || "—"}
            </Text>

            {/* NEW: status line */}
            {isUploading ? (
              <HStack align="center" gap={8} style={{ marginTop: 2 }}>
                <Text muted numberOfLines={1}>
                  {uploadLabel ?? "Uploading…"}
                </Text>
              </HStack>
            ) : (
              <Text muted numberOfLines={1}>
                {email}
              </Text>
            )}
          </VStack>
        </HStack>
      </VStack>
    </Card>
  );
}
