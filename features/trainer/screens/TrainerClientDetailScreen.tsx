import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Platform, RefreshControl, View } from "react-native";

import {
  formatDatePretty,
  useTrainerClientDetail,
} from "@/features/trainer/hooks/useTrainerClientDetail";
import { AppInput } from "@/shared/components/AppInput";
import { BottomSheetPicker } from "@/shared/components/BottomSheetPicker";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";
import {
  Button,
  Card,
  Divider,
  HStack,
  LoadingSpinner,
  StickyHeader,
  Text,
  VStack,
} from "@/shared/ui";

export default function TrainerClientDetailScreen() {
  const {
    t,
    theme,
    headerHeight,
    clientProfile,
    clientUser,
    fullName,
    isArchived,
    linksLoading,
    profileLoading,
    linksErrorMessage,
    profileErrorMessage,
    managementForm,
    statusOptions,
    freqOptions,
    showDatePicker,
    setShowDatePicker,
    setManagementForm,
    refreshing,
    onRefresh,
    saveManagement,
    markNextCheckIn,
    toggleArchive,
    onDeletePress,
    headerGradient,
    avatar,
    upsertState,
    markCheckInState,
    setLinkStatusState,
    deleteState,
  } = useTrainerClientDetail();

  const renderField = (label: string, value: string) => (
    <HStack align="center" justify="space-between">
      <Text muted>{label}</Text>
      <Text style={{ maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </HStack>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
      />

      <StickyHeader
        title={fullName}
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
          {linksErrorMessage ? (
            <Text color={theme.colors.danger}>{linksErrorMessage}</Text>
          ) : null}
          {profileErrorMessage ? (
            <Text color={theme.colors.danger}>{profileErrorMessage}</Text>
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
                        {fullName}
                      </Text>
                      <Text muted numberOfLines={1}>
                        {clientProfile?.phone ?? "—"}
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
                      {isArchived
                        ? t("linking.clients.archived")
                        : t(`linking.management.status.${managementForm.clientStatus}`)}
                    </Text>
                  </View>
                </HStack>

                <Divider opacity={0.35} />

                <HStack align="center" justify="space-between">
                  <Text muted>{t("profile.fields.target")}</Text>
                  <Text>
                    {clientProfile?.target ?? t("linking.clients.noTarget")}
                  </Text>
                </HStack>
              </VStack>
            </View>
          </Card>

          {(linksLoading || profileLoading) && !clientProfile ? (
            <LoadingSpinner />
          ) : null}

          <Card>
            <VStack style={{ gap: 12 }}>
              <Text weight="bold">{t("linking.clientDetails.basicInfo")}</Text>
              <Divider opacity={0.6} />
              {renderField(t("profile.fields.phone"), clientProfile?.phone ?? "—")}
              {renderField(
                t("profile.fields.nationality"),
                clientProfile?.nationality ?? "—"
              )}
              {renderField(
                t("profile.fields.gender"),
                clientProfile?.gender ?? "—"
              )}
              {renderField(
                t("profile.fields.birthDate"),
                clientProfile?.birthDate ?? "—"
              )}
              {renderField(
                t("profile.fields.target"),
                clientProfile?.target ?? t("linking.clients.noTarget")
              )}
              {renderField(
                t("profile.fields.activityLevel"),
                clientProfile?.activityLevel ?? "—"
              )}
              {renderField(
                t("profile.fields.unitSystem"),
                clientProfile?.unitSystem ?? "—"
              )}
              {renderField(
                t("profile.fields.notes"),
                clientProfile?.notes ?? "—"
              )}
            </VStack>
          </Card>

          <Card>
            <VStack style={{ gap: theme.spacing.md }}>
              <Text weight="bold">{t("linking.clientDetails.trainerManagement")}</Text>

              <BottomSheetPicker
                label={t("linking.management.clientStatus")}
                value={managementForm.clientStatus}
                onChange={(value) =>
                  setManagementForm((prev) => ({
                    ...prev,
                    clientStatus: (value ?? "active") as any,
                  }))
                }
                options={statusOptions}
              />

              <BottomSheetPicker
                label={t("linking.management.checkInFrequency")}
                value={managementForm.checkInFrequency}
                onChange={(value) =>
                  setManagementForm((prev) => ({
                    ...prev,
                    checkInFrequency: (value ?? "weekly") as any,
                  }))
                }
                options={freqOptions}
              />

              <Card background="surface2">
                <VStack style={{ gap: 10 }}>
                  <Text variant="caption" style={{ opacity: 0.9 }}>
                    {t("linking.management.nextCheckInAt")}
                  </Text>
                  <HStack align="center" justify="space-between">
                    <Text>
                      {managementForm.nextCheckInAt
                        ? formatDatePretty(managementForm.nextCheckInAt)
                        : "—"}
                    </Text>
                    <Button
                      variant="icon"
                      height={40}
                      onPress={() => setShowDatePicker(true)}
                      left={
                        <Ionicons
                          name="calendar-outline"
                          size={24}
                          color={theme.colors.accent}
                        />
                      }
                    ></Button>
                  </HStack>
                </VStack>
              </Card>

              {showDatePicker ? (
                <DateTimePicker
                  value={
                    managementForm.nextCheckInAt
                      ? new Date(managementForm.nextCheckInAt)
                      : new Date()
                  }
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_event, date) => {
                    if (Platform.OS !== "ios") setShowDatePicker(false);
                    if (!date) return;
                    setManagementForm((prev) => ({
                      ...prev,
                      nextCheckInAt: date.toISOString(),
                    }));
                  }}
                />
              ) : null}

              <AppInput
                label={t("linking.management.coachNotes")}
                value={managementForm.coachNotes}
                onChangeText={(value) =>
                  setManagementForm((prev) => ({ ...prev, coachNotes: value }))
                }
                placeholder={t("profile.placeholders.notes")}
                multiline
                autoGrow
              />

              <HStack gap={10}>
                <Button
                  fullWidth
                  height={40}
                  style={{ flex: 1 }}
                  isLoading={upsertState.isLoading}
                  onPress={() => void saveManagement()}
                >
                  {t("common.save")}
                </Button>
              </HStack>

              <Button
                variant="secondary"
                height={40}
                isLoading={markCheckInState.isLoading}
                onPress={() => void markNextCheckIn()}
              >
                {t("linking.management.markCheckIn")}
              </Button>
            </VStack>
          </Card>

          <Card>
            <VStack style={{ gap: 10 }}>
              <Text weight="bold">{t("linking.clientDetails.linkActions")}</Text>
              <Button
                isLoading={setLinkStatusState.isLoading}
                height={40}
                onPress={() => void toggleArchive()}
              >
                {isArchived
                  ? t("linking.clients.unarchive")
                  : t("linking.clients.archive")}
              </Button>
              {isArchived ? (
                <Button
                  variant="secondary"
                  height={40}
                  isLoading={deleteState.isLoading}
                  onPress={onDeletePress}
                >
                  {t("linking.clients.deleteClient")}
                </Button>
              ) : null}
              {!clientUser && !linksLoading ? (
                <Text muted>{t("linking.clientDetails.notFound")}</Text>
              ) : null}
            </VStack>
          </Card>

          {(linksLoading || profileLoading) &&
          (upsertState.isLoading || markCheckInState.isLoading) ? (
            <LoadingSpinner />
          ) : null}
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
