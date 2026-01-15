import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { RefreshControl, View } from "react-native";

import {
  useClientCancelTrainerMutation,
  useClientSetRelationshipStatusMutation,
  useGetMyCoachQuery,
} from "../../../src/features/linking/api/linkingApiSlice";
import { KeyboardScreen } from "../../../src/shared/components/KeyboardScreen";
import { useAppSelector } from "../../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../../src/shared/i18n/useAppTranslation";
import {
  appToast,
  useAppAlert,
  Button,
  Card,
  Chip,
  HStack,
  Text,
  useTheme,
  VStack,
} from "../../../src/shared/ui";

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(d);
}

function parseCerts(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

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

function isHexColor(v: string) {
  const s = v.trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  const hasAlpha = h.length === 8;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const finalA = Math.max(0, Math.min(1, alpha * a));
  return `rgba(${r},${g},${b},${finalA})`;
}

export default function ClientCoachScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const auth = useAppSelector((s) => s.auth);
  const clientId = auth.userId ?? "";

  const { data, isLoading, error, refetch } = useGetMyCoachQuery(
    { clientId },
    { skip: !clientId }
  );

  const [setRelStatus, setRelStatusState] = useClientSetRelationshipStatusMutation();
  const [cancelTrainer, cancelTrainerState] = useClientCancelTrainerMutation();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const coachName =
    data?.trainer?.firstName || data?.trainer?.lastName
      ? `${data?.trainer?.firstName ?? ""} ${data?.trainer?.lastName ?? ""}`.trim()
      : data?.trainer?.email ?? "—";

  const relationshipStatus = data?.management?.clientRelationshipStatus ?? "active";
  const nextCheckIn = data?.management?.nextCheckInAt ?? null;
  const certs = React.useMemo(
    () => parseCerts(data?.trainerProfile?.certifications),
    [data?.trainerProfile?.certifications]
  );

  const doPause = async () => {
    if (!data?.trainer?.id) return;
    try {
      await setRelStatus({
        trainerId: data.trainer.id,
        status: "paused",
        pauseReason: null,
      }).unwrap();
      appToast.success(t("profile.toasts.saved"));
      await refetch();
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    }
  };

  const doResume = async () => {
    if (!data?.trainer?.id) return;
    try {
      await setRelStatus({
        trainerId: data.trainer.id,
        status: "active",
        pauseReason: null,
      }).unwrap();
      appToast.success(t("profile.toasts.saved"));
      await refetch();
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    }
  };

  const doDisconnect = async () => {
    if (!data?.trainer?.id) return;
    try {
      await cancelTrainer({ trainerId: data.trainer.id }).unwrap();
      appToast.success(t("common.done"));
      await refetch();
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    }
  };

  const primary = data?.trainerProfile?.primaryColor ?? "";
  const secondary = data?.trainerProfile?.secondaryColor ?? "";
  const brandA = primary && isHexColor(primary) ? primary : "#7C3AED";
  const brandB = secondary && isHexColor(secondary) ? secondary : "#38BDF8";

  const pageGradient = [
    hexToRgba(brandA, 0.50),
    hexToRgba(brandB, 0.35),
    "rgba(0,0,0,0.00)",
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
      />

      <KeyboardScreen
        padding={theme.spacing.lg}
        style={{ backgroundColor: "transparent" }}
        scrollStyle={{ backgroundColor: "transparent" }}
        contentContainerStyle={{ gap: theme.spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
      >
        <HStack align="center" justify="space-between">
          <Text variant="title" weight="bold">
            {t("linking.coach.title")}
          </Text>
        </HStack>

        {error ? (
          <Text color={theme.colors.danger}>
            {(error as any)?.message ?? t("auth.errors.generic")}
          </Text>
        ) : null}

        {isLoading ? <Text muted>{t("common.loading")}</Text> : null}

        {!isLoading && !data ? (
          <Card>
            <VStack style={{ gap: theme.spacing.sm }}>
              <Text muted>{t("linking.coach.notLinked")}</Text>
              <Button onPress={() => router.push("/(client)/find-trainer")}>
                {t("linking.coach.findTrainer")}
              </Button>
            </VStack>
          </Card>
        ) : null}

        {data ? (
          <VStack style={{ gap: theme.spacing.lg }}>
            <Card
              padded={false}
              style={{
                overflow: "hidden",
                borderColor: hexToRgba(brandA, 0.22),
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              <View style={{ position: "relative" }}>
                <LinearGradient
                  colors={[
                    hexToRgba(brandA, 0.28),
                    hexToRgba(brandB, 0.16),
                    "rgba(255,255,255,0.00)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
                />

                <VStack style={{ gap: 12, padding: 14 }}>
                  {/* Brand header */}
                  <HStack align="center" justify="space-between">
                    <HStack align="center" gap={10} style={{ flex: 1 }}>
                      {(() => {
                        const avatarUrl = data.trainer?.avatarUrl ?? "";
                        const initials = getInitials(
                          data.trainer?.firstName ?? "",
                          data.trainer?.lastName ?? ""
                        );
                        const seed = data.trainer?.id || data.trainer?.email || "seed";
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

                      <VStack style={{ flex: 1, gap: 4 }}>
                        <Text variant="caption" muted>
                          {t("linking.coach.title")}
                        </Text>
                        <Text
                          weight="bold"
                          style={{ fontSize: 20 }}
                          numberOfLines={1}
                        >
                          {data.trainerProfile?.brandName ?? coachName}
                        </Text>
                        <Text muted numberOfLines={1}>
                          {coachName}
                        </Text>
                      </VStack>
                    </HStack>

                    {data.trainerProfile?.logoUrl ? (
                      <View
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 16,
                          overflow: "hidden",
                          backgroundColor: "rgba(255,255,255,0.10)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.14)",
                        }}
                      >
                        <Image
                          source={{ uri: data.trainerProfile.logoUrl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      </View>
                    ) : null}
                  </HStack>

                  {data.trainerProfile?.bio ? (
                    <Text muted numberOfLines={5} style={{ lineHeight: 20 }}>
                      {data.trainerProfile.bio}
                    </Text>
                  ) : null}

                  {/* Check-in (not truncated) */}
                  <Card background="surface2">
                    <HStack align="center" justify="space-between">
                      <Text muted>{t("linking.coach.checkIn")}</Text>
                      <Text weight="semibold">
                        {nextCheckIn ? formatShortDate(nextCheckIn) : "—"}
                      </Text>
                    </HStack>
                  </Card>

                  {/* Contact */}
                  <Card background="surface2">
                    <VStack style={{ gap: 10 }}>
                      <Text variant="caption" muted>
                        {t("linking.coach.contact")}
                      </Text>
                      <HStack align="center" justify="space-between">
                        <Text muted>{t("auth.email")}</Text>
                        <Text style={{ maxWidth: "65%", textAlign: "right" }}>
                          {data.trainer?.email ?? "—"}
                        </Text>
                      </HStack>
                      <HStack align="center" justify="space-between">
                        <Text muted>{t("profile.fields.phone")}</Text>
                        <Text style={{ maxWidth: "65%", textAlign: "right" }}>
                          {data.trainerProfile?.phone ?? "—"}
                        </Text>
                      </HStack>
                    </VStack>
                  </Card>

                  {/* Actions (no reason) */}
                  <HStack gap={10}>
                    {relationshipStatus === "paused" ? (
                      <Button
                        fullWidth
                        style={{ flex: 1 }}
                        isLoading={setRelStatusState.isLoading}
                        onPress={() =>
                          alert.confirm({
                            title: t("linking.coach.resume"),
                            message: t("common.areYouSure"),
                            confirmText: t("linking.coach.resume"),
                            cancelText: t("common.cancel"),
                            onConfirm: async () => {
                              await doResume();
                            },
                          })
                        }
                      >
                        {t("linking.coach.resume")}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        style={{ flex: 1 }}
                        isLoading={setRelStatusState.isLoading}
                        onPress={() =>
                          alert.confirm({
                            title: t("linking.coach.pause"),
                            message: t("common.areYouSure"),
                            confirmText: t("linking.coach.pause"),
                            cancelText: t("common.cancel"),
                            onConfirm: async () => {
                              await doPause();
                            },
                          })
                        }
                      >
                        {t("linking.coach.pause")}
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      fullWidth
                      style={{ flex: 1 }}
                      isLoading={cancelTrainerState.isLoading}
                      textStyle={{ color: theme.colors.danger }}
                      onPress={() =>
                        alert.confirm({
                          title: t("linking.coach.disconnect"),
                          message: t("common.areYouSure"),
                          confirmText: t("linking.coach.disconnect"),
                          cancelText: t("common.cancel"),
                          destructive: true,
                          onConfirm: async () => {
                            await doDisconnect();
                          },
                        })
                      }
                    >
                      {t("linking.coach.disconnect")}
                    </Button>
                  </HStack>
                </VStack>
              </View>
            </Card>

            {/* Certificates */}
            <Card>
              <VStack style={{ gap: 10 }}>
                <Text weight="bold">{t("profile.fields.certifications")}</Text>
                {certs.length ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {certs.map((c) => (
                      <Chip key={c} label={c} />
                    ))}
                  </View>
                ) : (
                  <Text muted>{t("profile.certifications.empty")}</Text>
                )}
              </VStack>
            </Card>
          </VStack>
        ) : null}
      </KeyboardScreen>
    </View>
  );
}

