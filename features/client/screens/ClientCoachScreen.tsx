import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { RefreshControl, View } from "react-native";

import { useClientCoach } from "@/features/client/hooks/useClientCoach";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";
import {
  Button,
  Card,
  Chip,
  HStack,
  LoadingSpinner,
  StickyHeader,
  Text,
  VStack,
} from "@/shared/ui";

export default function ClientCoachScreen() {
  const {
    t,
    theme,
    headerHeight,
    data,
    coachName,
    relationshipStatus,
    nextCheckIn,
    certs,
    isLoading,
    errorMessage,
    refreshing,
    onRefresh,
    onPausePress,
    onResumePress,
    onDisconnectPress,
    setRelStatusState,
    cancelTrainerState,
    pageGradient,
    avatar,
    formatShortDate,
  } = useClientCoach();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={pageGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
      />

      <StickyHeader
        title={t("tabs.coach")}
        leftButton={{
          label: "",
          onPress: () => router.back(),
          variant: "ghost",
          icon: (
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          ),
        }}
        backgroundColor={theme.colors.background}
      />

      <KeyboardScreen
        bottomSpace={12}
        headerHeight={headerHeight}
        style={{ backgroundColor: "transparent" }}
        scrollStyle={{ backgroundColor: "transparent" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
      >
        <VStack style={{ gap: theme.spacing.lg }}>
          {errorMessage ? (
            <Text color={theme.colors.danger}>{errorMessage}</Text>
          ) : null}

          <Card padded={false} style={{ overflow: "hidden" }}>
            <View style={{ position: "relative" }}>
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.08)",
                  "rgba(255,255,255,0.02)",
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
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: avatar.bg,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.14)",
                      }}
                    >
                      {avatar.imageUrl ? (
                        <Image
                          source={{ uri: avatar.imageUrl }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : avatar.initials ? (
                        <Text weight="bold" style={{ color: "white", fontSize: 14 }}>
                          {avatar.initials}
                        </Text>
                      ) : (
                        <Ionicons name="person" size={20} color="white" />
                      )}
                    </View>

                    <VStack style={{ flex: 1 }}>
                      <Text weight="bold" style={{ fontSize: 18 }} numberOfLines={1}>
                        {coachName}
                      </Text>
                      <Text muted numberOfLines={1}>
                        {data?.trainer?.email ?? "—"}
                      </Text>
                    </VStack>
                  </HStack>

                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.10)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.14)",
                    }}
                  >
                    <Text variant="caption">
                      {relationshipStatus === "paused"
                        ? t("linking.coach.paused")
                        : t("linking.coach.active")}
                    </Text>
                  </View>
                </HStack>

                <HStack align="center" justify="space-between">
                  <Text muted>{t("linking.coach.nextCheckIn")}</Text>
                  <Text>
                    {nextCheckIn ? formatShortDate(nextCheckIn) : "—"}
                  </Text>
                </HStack>
              </VStack>
            </View>
          </Card>

          {isLoading && !data ? <LoadingSpinner /> : null}

          <Card>
            <VStack style={{ gap: theme.spacing.md }}>
              <Text weight="bold">{t("linking.coach.details")}</Text>
              <HStack align="center" justify="space-between">
                <Text muted>{t("profile.fields.brandName")}</Text>
                <Text>{data?.trainerProfile?.brandName ?? coachName}</Text>
              </HStack>
              <HStack align="center" justify="space-between">
                <Text muted>{t("profile.fields.fullName")}</Text>
                <Text>{coachName}</Text>
              </HStack>
              <HStack align="center" justify="space-between">
                <Text muted>{t("profile.fields.email")}</Text>
                <Text>{data?.trainer?.email ?? "—"}</Text>
              </HStack>
              <HStack align="center" justify="space-between">
                <Text muted>{t("profile.fields.phone")}</Text>
                <Text>{data?.trainerProfile?.phone ?? "—"}</Text>
              </HStack>
            </VStack>
          </Card>

          {data?.trainerProfile?.logoUrl ? (
            <Card padded={false} style={{ overflow: "hidden" }}>
              <Image
                source={{ uri: data.trainerProfile.logoUrl }}
                style={{ width: "100%", height: 180 }}
                contentFit="cover"
              />
            </Card>
          ) : null}

          {data?.trainerProfile?.bio ? (
            <Card>
              <Text>{data.trainerProfile.bio}</Text>
            </Card>
          ) : null}

          <Card>
            <VStack style={{ gap: 10 }}>
              <Text weight="bold">{t("linking.coach.actions")}</Text>
              {relationshipStatus === "paused" ? (
                <Button
                  height={40}
                  isLoading={setRelStatusState.isLoading}
                  onPress={onResumePress}
                >
                  {t("linking.coach.resume")}
                </Button>
              ) : (
                <Button
                  height={40}
                  isLoading={setRelStatusState.isLoading}
                  onPress={onPausePress}
                >
                  {t("linking.coach.pause")}
                </Button>
              )}
              <Button
                variant="secondary"
                height={40}
                isLoading={cancelTrainerState.isLoading}
                onPress={onDisconnectPress}
              >
                {t("linking.coach.disconnect")}
              </Button>
            </VStack>
          </Card>

          <Card>
            <VStack style={{ gap: 10 }}>
              <Text weight="bold">{t("profile.fields.certifications")}</Text>
              {certs.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {certs.map((cert) => (
                    <Chip key={cert} label={cert} />
                  ))}
                </View>
              ) : (
                <Text muted>{t("profile.certifications.empty")}</Text>
              )}
            </VStack>
          </Card>
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
