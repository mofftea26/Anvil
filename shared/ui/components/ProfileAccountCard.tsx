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
  changeLabel,
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
  changeLabel?: string;
}) {
  const theme = useTheme();
  const initials = getInitials(firstName, lastName);
  const bg = pickAvatarBg(seed);
  const hasImage = Boolean(avatarUrl);

  const isBusy = Boolean(disabled || isUploading);

  return (
    <Card
      bordered
      style={{
        backgroundColor: theme.colors.surface2,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
    >
      <VStack style={{ gap: theme.spacing.md }}>
        <HStack align="center" justify="space-between" style={{ minHeight: 24 }}>
          <Text variant="caption" muted>
            {title}
          </Text>

          {hasImage && onPressClear ? (
            <Pressable
              onPress={onPressClear}
              disabled={isBusy}
              style={({ pressed }) => ({
                opacity: isBusy ? 0.5 : pressed ? 0.82 : 1,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface3,
              })}
            >
              <Text variant="caption" style={{ color: theme.colors.text }}>
                {clearLabel ?? "Clear"}
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
        </HStack>

        <HStack align="center" gap={14}>
          <Pressable
            onPress={onPressAvatar}
            style={{ position: "relative" }}
            disabled={isBusy}
          >
            <View
              style={{
                width: 78,
                height: 78,
                borderRadius: 39,
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

            <View
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "rgba(0,0,0,0.5)",
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
            <Text weight="bold" style={{ fontSize: 19 }}>
              {`${firstName ?? ""} ${lastName ?? ""}`.trim() || "—"}
            </Text>

            {isUploading ? (
              <HStack align="center" gap={8} style={{ marginTop: 4 }}>
                <Text muted numberOfLines={1}>
                  {uploadLabel ?? "Uploading…"}
                </Text>
              </HStack>
            ) : (
              <Text muted numberOfLines={1} style={{ marginTop: 2 }}>
                {email}
              </Text>
            )}
            {!isUploading && changeLabel ? (
              <Text
                variant="caption"
                style={{ marginTop: 6, color: theme.colors.accent }}
              >
                {changeLabel}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      </VStack>
    </Card>
  );
}
