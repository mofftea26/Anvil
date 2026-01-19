import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform, RefreshControl, View } from "react-native";

import {
  useDeleteArchivedClientLinkMutation,
  useGetTrainerClientsQuery,
  useMarkClientCheckInMutation,
  useSetTrainerClientStatusMutation,
  useUpsertTrainerClientManagementMutation,
} from "@/features/linking/api/linkingApiSlice";
import { useGetClientProfileQuery } from "@/features/profile/api/profileApiSlice";
import { AppInput } from "@/shared/components/AppInput";
import { BottomSheetPicker } from "@/shared/components/BottomSheetPicker";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  Button,
  Card,
  Divider,
  HStack,
  LoadingSpinner,
  StickyHeader,
  Text,
  useAppAlert,
  useStickyHeaderHeight,
  useTheme,
  VStack,
} from "@/shared/ui";

import {
  formatDatePretty,
  getInitials,
  hexToRgba,
  pickAvatarBg,
} from "../utils/clientUi";

export default function TrainerClientDetailsScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();
  const auth = useAppSelector((s) => s.auth);
  const params = useLocalSearchParams<{ clientId?: string }>();

  const clientId = String(params.clientId ?? "");
  const trainerId = auth.userId ?? "";

  const {
    data: links,
    isLoading: linksLoading,
    error: linksError,
    refetch: refetchLinks,
  } = useGetTrainerClientsQuery({ trainerId }, { skip: !trainerId });

  const link = React.useMemo(
    () => links?.find((l) => l.clientId === clientId) ?? null,
    [links, clientId]
  );

  const clientUser = link?.client ?? null;
  const fullName =
    clientUser?.firstName || clientUser?.lastName
      ? `${clientUser?.firstName ?? ""} ${clientUser?.lastName ?? ""}`.trim()
      : clientUser?.email ?? "—";

  const isArchived = link?.status === "archived";

  const {
    data: clientProfile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetClientProfileQuery(clientId, { skip: !clientId });

  const [upsertManagement, upsertState] =
    useUpsertTrainerClientManagementMutation();
  const [markCheckIn, markCheckInState] = useMarkClientCheckInMutation();
  const [setLinkStatus, setLinkStatusState] =
    useSetTrainerClientStatusMutation();
  const [deleteLink, deleteState] = useDeleteArchivedClientLinkMutation();

  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const [managementForm, setManagementForm] = React.useState<{
    clientStatus: "active" | "paused" | "inactive";
    checkInFrequency: "weekly" | "biweekly" | "monthly" | "custom";
    nextCheckInAt: string | null;
    coachNotes: string;
  }>({
    clientStatus: "active",
    checkInFrequency: "weekly",
    nextCheckInAt: null,
    coachNotes: "",
  });

  const management = link?.management ?? null;
  React.useEffect(() => {
    if (!management) return;
    setManagementForm({
      clientStatus: management.clientStatus,
      checkInFrequency: management.checkInFrequency,
      nextCheckInAt: management.nextCheckInAt,
      coachNotes: management.coachNotes ?? "",
    });
  }, [management]);

  const statusOptions = React.useMemo(
    () => [
      { value: "active", label: t("linking.management.status.active") },
      { value: "paused", label: t("linking.management.status.paused") },
      { value: "inactive", label: t("linking.management.status.inactive") },
    ],
    [t]
  );

  const freqOptions = React.useMemo(
    () => [
      { value: "weekly", label: t("linking.management.frequency.weekly") },
      { value: "biweekly", label: t("linking.management.frequency.biweekly") },
      { value: "monthly", label: t("linking.management.frequency.monthly") },
      { value: "custom", label: t("linking.management.frequency.custom") },
    ],
    [t]
  );

  const refreshAll = React.useCallback(async () => {
    await Promise.all([refetchLinks(), refetchProfile()]);
  }, [refetchLinks, refetchProfile]);
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  const saveManagement = async () => {
    try {
      await upsertManagement({
        clientId,
        clientStatus: managementForm.clientStatus,
        checkInFrequency: managementForm.checkInFrequency,
        nextCheckInAt: managementForm.nextCheckInAt,
        coachNotes: managementForm.coachNotes.trim()
          ? managementForm.coachNotes.trim()
          : null,
      }).unwrap();
      appToast.success(t("profile.toasts.saved"));
      await refreshAll();
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    }
  };

  const markNextCheckIn = async () => {
    if (!managementForm.nextCheckInAt) {
      appToast.error(t("linking.management.nextCheckInMissing"));
      return;
    }
    try {
      await markCheckIn({
        clientId,
        nextCheckInAt: managementForm.nextCheckInAt,
      }).unwrap();
      appToast.success(t("profile.toasts.saved"));
      await refreshAll();
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    }
  };

  const toggleArchive = async () => {
    try {
      await setLinkStatus({
        clientId,
        status: isArchived ? "active" : "archived",
      }).unwrap();
      await refreshAll();
    } catch (e: any) {
      appToast.error(e?.message ?? t("auth.errors.generic"));
    }
  };

  const doDelete = async () => {
    try {
      await deleteLink({ clientId }).unwrap();
      appToast.success(t("common.done"));
      router.back();
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.toLowerCase().includes("archived")) {
        appToast.error(t("linking.clients.mustArchiveBeforeDelete"));
      } else {
        appToast.error(msg || t("auth.errors.generic"));
      }
    }
  };

  const renderField = (label: string, value: string) => (
    <HStack align="center" justify="space-between">
      <Text muted>{label}</Text>
      <Text style={{ maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </HStack>
  );

  const brandA = theme.colors.accent;
  const brandB = theme.colors.accent2;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={[
          hexToRgba(brandA, 0.45),
          hexToRgba(brandB, 0.3),
          "rgba(0,0,0,0.00)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
      />

      <StickyHeader
        title={fullName}
        showBackButton={true}
      />

      <KeyboardScreen
        bottomSpace={12}
        headerHeight={useStickyHeaderHeight()}
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
          {linksError ? (
            <Text color={theme.colors.danger}>
              {(linksError as any)?.message ?? t("auth.errors.generic")}
            </Text>
          ) : null}
          {profileError ? (
            <Text color={theme.colors.danger}>
              {(profileError as any)?.message ?? t("auth.errors.generic")}
            </Text>
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
                    {(() => {
                      const avatarUrl = clientUser?.avatarUrl ?? "";
                      const hasImage = Boolean(avatarUrl);
                      const initials = getInitials(
                        clientUser?.firstName,
                        clientUser?.lastName
                      );
                      const seed =
                        clientUser?.id || clientUser?.email || clientId;
                      const bg = pickAvatarBg(seed);

                      return (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            overflow: "hidden",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: hasImage
                              ? "rgba(255,255,255,0.10)"
                              : bg,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.14)",
                          }}
                        >
                          {hasImage ? (
                            <Image
                              source={{ uri: avatarUrl }}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                              cachePolicy="none"
                              transition={1000}
                            />
                          ) : initials ? (
                            <Text
                              weight="bold"
                              style={{ color: "white", fontSize: 14 }}
                            >
                              {initials}
                            </Text>
                          ) : (
                            <Ionicons name="person" size={20} color="white" />
                          )}
                        </View>
                      );
                    })()}

                    <VStack style={{ flex: 1 }}>
                      <Text
                        weight="bold"
                        style={{ fontSize: 18 }}
                        numberOfLines={1}
                      >
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
                        : t(
                            `linking.management.status.${managementForm.clientStatus}`
                          )}
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
              {renderField(
                t("profile.fields.phone"),
                clientProfile?.phone ?? "—"
              )}
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
              <Text weight="bold">
                {t("linking.clientDetails.trainerManagement")}
              </Text>

              <BottomSheetPicker
                label={t("linking.management.clientStatus")}
                value={managementForm.clientStatus}
                onChange={(v) =>
                  setManagementForm((prev) => ({
                    ...prev,
                    clientStatus: (v ?? "active") as any,
                  }))
                }
                options={statusOptions}
              />

              <BottomSheetPicker
                label={t("linking.management.checkInFrequency")}
                value={managementForm.checkInFrequency}
                onChange={(v) =>
                  setManagementForm((prev) => ({
                    ...prev,
                    checkInFrequency: (v ?? "weekly") as any,
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
                onChangeText={(v) =>
                  setManagementForm((prev) => ({ ...prev, coachNotes: v }))
                }
                placeholder={t("profile.placeholders.notes")}
                multiline
                autoGrow
              />

              {/* actions */}
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
              <Text weight="bold">
                {t("linking.clientDetails.linkActions")}
              </Text>
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
                  onPress={() =>
                    alert.confirm({
                      title: t("linking.clients.deleteClient"),
                      message: t("common.areYouSure"),
                      confirmText: t("common.delete"),
                      cancelText: t("common.cancel"),
                      destructive: true,
                      onConfirm: async () => {
                        await doDelete();
                      },
                    })
                  }
                >
                  {t("linking.clients.deleteClient")}
                </Button>
              ) : null}
              {!link && !linksLoading ? (
                <Text muted>{t("linking.clientDetails.notFound")}</Text>
              ) : null}
            </VStack>
          </Card>

          {(linksLoading || profileLoading) &&
          (upsertState.isLoading ||
            markCheckInState.isLoading) ? (
            <LoadingSpinner />
          ) : null}
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
