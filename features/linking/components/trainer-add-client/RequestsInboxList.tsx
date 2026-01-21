import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

import { getInitials, pickAvatarBg } from "@/features/clients/utils/clientUi";
import type { TrainerRequestsInboxRow } from "@/features/linking/api/linkingApiSlice";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  Divider,
  HStack,
  LoadingSpinner,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

type RequestsInboxListProps = {
  requests: TrainerRequestsInboxRow[];
  isLoading: boolean;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
};

export function RequestsInboxList({
  requests,
  isLoading,
  onAccept,
  onDecline,
}: RequestsInboxListProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <VStack style={{ gap: theme.spacing.md }}>
      <Text weight="bold">{t("linking.requests.title")}</Text>

      {isLoading ? <LoadingSpinner /> : null}

      {!isLoading && (!requests?.length || requests.length === 0) ? (
        <Card>
          <Text muted>{t("linking.requests.empty")}</Text>
        </Card>
      ) : (
        <VStack style={{ gap: theme.spacing.md }}>
          {requests?.map((r) => {

            const client = r.clientFirstName && r.clientLastName && r.clientAvatarUrl ? {
              firstName: r.clientFirstName,
              lastName: r.clientLastName,
              avatarUrl: r.clientAvatarUrl,
            } : null;
            const fullName =
              client?.firstName || client?.lastName
                ? `${client?.firstName ?? ""} ${client?.lastName ?? ""}`.trim()
                : null;
            const displayName = fullName || r.trainerEmail || r.clientId || "—";
            const displayEmail = r.trainerEmail || null;

            const avatarUrl = client?.avatarUrl ?? "";
            const hasImage = Boolean(avatarUrl);
            const initials = getInitials(client?.firstName, client?.lastName);
            const seed = r.clientId || r.id;
            const bg = pickAvatarBg(seed);

            return (
              <Card key={r.id}>
                <VStack style={{ gap: theme.spacing.md }}>
              
                  <HStack align="center" gap={theme.spacing.md}>
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: bg,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      {hasImage ? (
                        <Image
                          source={{ uri: avatarUrl }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      ) : initials ? (
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          {initials}
                        </Text>
                      ) : null}
                    </View>

                    <VStack style={{ flex: 1, gap: 4 }}>
                      <Text weight="semibold" style={{ fontSize: 16 }}>
                        {displayName}
                      </Text>
                      {displayEmail && displayEmail !== displayName ? (
                        <Text
                          muted
                          style={{ fontSize: 13 }}
                          numberOfLines={1}
                        >
                          {displayEmail}
                        </Text>
                      ) : null}
                    </VStack>
                  </HStack>

                  {r.message ? (
                    <>
                      <Divider opacity={0.6} />
                      <Text muted style={{ fontSize: 14, lineHeight: 20 }}>
                        {r.message}
                      </Text>
                    </>
                  ) : null}

                  <Divider opacity={0.6} />
                  <HStack gap={theme.spacing.md}>
                    <Button
                      fullWidth
                      style={{ flex: 1 }}
                      onPress={() => onAccept(r.id)}
                    >
                      {t("linking.requests.accept")}
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      style={{ flex: 1 }}
                      onPress={() => onDecline(r.id)}
                    >
                      {t("linking.requests.decline")}
                    </Button>
                  </HStack>
                </VStack>
              </Card>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
