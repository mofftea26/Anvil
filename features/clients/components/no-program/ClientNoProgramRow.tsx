import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import type { ClientWithoutActiveProgram } from "@/features/clients/api/clientsWithoutProgram.api";
import {
  getInitials,
  pickAvatarBg,
} from "@/features/linking/utils/coachFormatting";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

type Props = {
  row: ClientWithoutActiveProgram;
  onQuickAssign: () => void;
};

export function ClientNoProgramRow(props: Props) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const first = props.row.firstName?.trim() ?? "";
  const last = props.row.lastName?.trim() ?? "";
  const name =
    `${first} ${last}`.trim() || props.row.email || t("trainer.dashboard.unnamedClient", "Unnamed client");
  const seed = props.row.clientId || props.row.email || "c";
  const seedColor = pickAvatarBg(seed);
  const initials = getInitials(first, last);

  const lastIn =
    props.row.lastCheckInAt != null
      ? new Date(props.row.lastCheckInAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <View
      style={{
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface2,
        padding: 12,
        gap: 10,
      }}
    >
      <Pressable
        onPress={() =>
          router.push(`/(trainer)/client/${props.row.clientId}` as Parameters<typeof router.push>[0])
        }
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <HStack align="center" gap={12}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              overflow: "hidden",
              backgroundColor: props.row.avatarUrl ? theme.colors.surface3 : seedColor,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            {props.row.avatarUrl ? (
              <Image
                source={{ uri: props.row.avatarUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : initials ? (
              <Text weight="bold" style={{ color: "#fff", fontSize: 14 }}>
                {initials}
              </Text>
            ) : (
              <Icon name="person" size={18} color="#fff" />
            )}
          </View>
          <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text weight="bold" numberOfLines={1} style={{ fontSize: 15 }}>
              {name}
            </Text>
            <HStack align="center" gap={6} style={{ flexWrap: "wrap" }}>
              {lastIn ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: theme.radii.md,
                    backgroundColor: theme.colors.surface3,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Text variant="caption" muted style={{ fontSize: 11 }}>
                    {t("trainer.noProgram.lastCheckIn", "Last check-in {{date}}", { date: lastIn })}
                  </Text>
                </View>
              ) : (
                <Text variant="caption" muted style={{ fontSize: 11 }}>
                  {t("trainer.noProgram.neverCheckedIn", "No check-in logged")}
                </Text>
              )}
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
      <Button
        variant="secondary"
        height={40}
        onPress={props.onQuickAssign}
        left={<Icon name="layers-outline" size={18} color={theme.colors.text} />}
      >
        {t("trainer.noProgram.quickAssign", "Quick assign program")}
      </Button>
    </View>
  );
}
