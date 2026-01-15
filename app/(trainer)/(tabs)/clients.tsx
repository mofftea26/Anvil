import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { useGetTrainerClientsQuery, useSetTrainerClientStatusMutation } from "../../../src/features/linking/api/linkingApiSlice";
import { useAppSelector } from "../../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import { appToast, Button, Card, HStack, Text, useTheme, VStack } from "../../../src/shared/ui";

function formatWeekdayShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d);
}

function getInitials(firstName: string | null | undefined, lastName: string | null | undefined): string | null {
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
  const palette = ["#7C3AED", "#38BDF8", "#22C55E", "#F97316", "#F43F5E", "#A855F7", "#06B6D4"];
  const idx = hashStringToInt(seed) % palette.length;
  return palette[idx];
}

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
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
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
          <Text color={theme.colors.danger}>
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

              const target = c?.profile?.target ?? null;
              const targetText = target
                ? String(target)
                : t("linking.clients.noTarget");

              const nextCheckIn = row.management?.nextCheckInAt ?? null;
              const checkInText = nextCheckIn ? formatWeekdayShort(nextCheckIn) : "—";

              const statusPill = isArchived
                ? {
                    label: t("linking.clients.archive"),
                    bg: "rgba(255,255,255,0.10)",
                    border: "rgba(255,255,255,0.16)",
                    text: theme.colors.text,
                  }
                : {
                    label: t(`linking.management.status.${row.management?.clientStatus ?? "active"}`),
                    bg: "rgba(255,255,255,0.10)",
                    border: "rgba(255,255,255,0.16)",
                    text: theme.colors.text,
                  };

              return (
                <Card
                  key={row.id}
                  padded={false}
                  style={{ overflow: "hidden" }}
                >
                  <View style={{ position: "relative" }}>
                    <LinearGradient
                      colors={[
                        "rgba(124,58,237,0.22)",
                        "rgba(56,189,248,0.10)",
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
                          {(() => {
                            const avatarUrl = c?.avatarUrl ?? "";
                            const hasImage = Boolean(avatarUrl);
                            const initials = getInitials(c?.firstName, c?.lastName);
                            const seed = c?.id || c?.email || row.clientId || row.id;
                            const bg = pickAvatarBg(seed);

                            return (
                              <View
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 21,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  overflow: "hidden",
                                  backgroundColor: hasImage ? "rgba(255,255,255,0.10)" : bg,
                                  borderWidth: 1,
                                  borderColor: "rgba(255,255,255,0.14)",
                                }}
                              >
                                {hasImage ? (
                                  <Image
                                    source={{ uri: avatarUrl }}
                                    style={{ width: "100%", height: "100%" }}
                                    contentFit="cover"
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
                          })()}
                          <VStack style={{ flex: 1 }}>
                            <Text weight="bold" numberOfLines={1} style={{ fontSize: 16 }}>
                              {name}
                            </Text>
                          </VStack>
                        </HStack>

                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            backgroundColor: statusPill.bg,
                            borderWidth: 1,
                            borderColor: statusPill.border,
                          }}
                        >
                          <Text variant="caption" style={{ color: statusPill.text }}>
                            {statusPill.label}
                          </Text>
                        </View>
                      </HStack>

                      <View
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.10)",
                          borderRadius: 14,
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                        }}
                      >
                        <HStack align="center" style={{ gap: 12 }}>
                          <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                            <Text variant="caption" muted>
                              {t("profile.fields.target")}
                            </Text>
                            <Text numberOfLines={1} weight="semibold">
                              {targetText}
                            </Text>
                          </VStack>

                          <View
                            style={{
                              width: 1,
                              alignSelf: "stretch",
                              backgroundColor: "rgba(255,255,255,0.10)",
                            }}
                          />

                          <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                            <Text variant="caption" muted>
                              {t("linking.clients.nextCheckIn")}
                            </Text>
                            <Text numberOfLines={1} weight="semibold">
                              {checkInText}
                            </Text>
                          </VStack>
                        </HStack>
                      </View>

                      <HStack gap={10}>
                        <Button
                          variant="secondary"
                          height={40}
                          fullWidth
                          style={{ flex: 1 }}
                          onPress={() =>
                            router.push(`/(trainer)/client/${row.clientId}`)
                          }
                        >
                          {t("linking.clients.viewClient")}
                        </Button>
                        <Button
                          height={40}
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
                        >
                          {isArchived
                            ? t("linking.clients.unarchive")
                            : t("linking.clients.archive")}
                        </Button>
                      </HStack>
                    </VStack>
                  </View>
                </Card>
              );
            })}
          </VStack>
        )}

      </ScrollView>
    </View>
  );
}

