import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";

import { useGetTrainerClientsQuery, useSetTrainerClientStatusMutation } from "../../../src/features/linking/api/linkingApiSlice";
import { useAppSelector } from "../../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import { appToast, Button, Card, HStack, Text, useTheme, VStack } from "../../../src/shared/ui";

export default function TrainerClientsScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);

  const trainerId = auth.userId ?? "";
  const { data, isLoading, error, refetch } = useGetTrainerClientsQuery(
    { trainerId },
    { skip: !trainerId }
  );
  const [setStatus, setStatusState] = useSetTrainerClientStatusMutation();

  return (
    <VStack
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
      }}
    >
      <HStack align="center" justify="space-between">
        <Text variant="title" weight="bold">
          {t("linking.clients.title")}
        </Text>
        <Button
          variant="secondary"
          height={42}
          onPress={() => router.push("/(trainer)/add-client")}
        >
          + {t("linking.clients.addClient")}
        </Button>
      </HStack>

      {error ? (
        <Text color={theme.colors.accent2}>
          {(error as any)?.message ?? t("auth.errors.generic")}
        </Text>
      ) : null}

      {isLoading ? (
        <Text muted>{t("common.loading")}</Text>
      ) : !data?.length ? (
        <Card>
          <VStack style={{ gap: theme.spacing.sm }}>
            <Text weight="bold">{t("linking.clients.empty")}</Text>
            <Button onPress={() => router.push("/(trainer)/add-client")}>
              {t("linking.clients.addClient")}
            </Button>
          </VStack>
        </Card>
      ) : (
        <VStack style={{ gap: theme.spacing.md }}>
          {data.map((row) => {
            const c = row.client;
            const name =
              c?.firstName || c?.lastName
                ? `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim()
                : c?.email ?? "—";

            const isArchived = row.status === "archived";

            return (
              <Card key={row.id}>
                <VStack style={{ gap: 10 }}>
                  <HStack align="center" justify="space-between">
                    <HStack align="center" gap={10}>
                      <Ionicons name="person-circle" size={34} color={theme.colors.textMuted} />
                      <VStack>
                        <Text weight="bold">{name}</Text>
                        <Text muted>{c?.email ?? ""}</Text>
                      </VStack>
                    </HStack>

                    <Text muted>{row.status}</Text>
                  </HStack>

                  <HStack gap={10}>
                    <Button
                      variant="secondary"
                      fullWidth
                      style={{ flex: 1 }}
                      onPress={() => appToast.info(t("linking.clients.viewClient"))}
                      left={<Ionicons name="eye-outline" size={18} color={theme.colors.text} />}
                    >
                      {t("linking.clients.viewClient")}
                    </Button>
                    <Button
                      fullWidth
                      style={{ flex: 1 }}
                      isLoading={setStatusState.isLoading}
                      onPress={async () => {
                        try {
                          await setStatus({
                            clientId: row.clientId,
                            status: isArchived ? "active" : "archived",
                          }).unwrap();
                          await refetch();
                        } catch (e: any) {
                          appToast.error(e?.message ?? t("auth.errors.generic"));
                        }
                      }}
                      left={
                        <Ionicons
                          name={isArchived ? "arrow-up-circle-outline" : "archive-outline"}
                          size={18}
                          color={theme.colors.background}
                        />
                      }
                    >
                      {isArchived ? t("linking.clients.unarchive") : t("linking.clients.archive")}
                    </Button>
                  </HStack>
                </VStack>
              </Card>
            );
          })}
        </VStack>
      )}

      <View style={{ height: 6 }} />
    </VStack>
  );
}

