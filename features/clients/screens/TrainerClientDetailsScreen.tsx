import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { RefreshControl, View } from "react-native";

import { ClientDetailsBasicInfoCard } from "@/features/clients/components/trainer-client-details/ClientDetailsBasicInfoCard";
import { ClientDetailsHeroCard } from "@/features/clients/components/trainer-client-details/ClientDetailsHeroCard";
import { ClientDetailsLinkActionsCard } from "@/features/clients/components/trainer-client-details/ClientDetailsLinkActionsCard";
import { ClientDetailsManagementCard } from "@/features/clients/components/trainer-client-details/ClientDetailsManagementCard";
import { useTrainerClientDetails } from "@/features/clients/hooks/trainer-client-details/useTrainerClientDetails";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  LoadingSpinner,
  StickyHeader,
  Text,
  useAppAlert,
  useStickyHeaderHeight,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function TrainerClientDetailsScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();

  const {
    clientId,
    clientUser,
    clientProfile,
    fullName,
    isArchived,
    link,
    managementForm,
    setManagementForm,
    showDatePicker,
    setShowDatePicker,
    statusOptions,
    freqOptions,
    linksError,
    profileError,
    linksLoading,
    profileLoading,
    refreshing,
    onRefresh,
    saveManagement,
    markNextCheckIn,
    toggleArchive,
    doDelete,
    upsertLoading,
    markCheckInLoading,
    setLinkStatusLoading,
    deleteLoading,
    hexToRgba,
    formatDatePretty,
    setNextCheckInDate,
  } = useTrainerClientDetails();

  const brandA = theme.colors.accent;
  const brandB = theme.colors.accent2;
  const headerHeight = useStickyHeaderHeight();

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

      <StickyHeader title={fullName} showBackButton />

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
          {linksError ? (
            <Text color={theme.colors.danger}>
              {(linksError as { message?: string })?.message ?? t("auth.errors.generic")}
            </Text>
          ) : null}
          {profileError ? (
            <Text color={theme.colors.danger}>
              {(profileError as { message?: string })?.message ?? t("auth.errors.generic")}
            </Text>
          ) : null}

          <ClientDetailsHeroCard
            clientUser={clientUser}
            clientId={clientId}
            fullName={fullName}
            phone={clientProfile?.phone}
            isArchived={isArchived}
            clientStatus={managementForm.clientStatus}
            target={clientProfile?.target}
          />

          {(linksLoading || profileLoading) && !clientProfile ? (
            <LoadingSpinner />
          ) : null}

          <ClientDetailsBasicInfoCard profile={clientProfile} />

          <ClientDetailsManagementCard
            form={managementForm}
            setForm={setManagementForm}
            statusOptions={statusOptions}
            freqOptions={freqOptions}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            setNextCheckInDate={setNextCheckInDate}
            formatDatePretty={formatDatePretty}
            onSave={saveManagement}
            onMarkCheckIn={markNextCheckIn}
            saveLoading={upsertLoading}
            markCheckInLoading={markCheckInLoading}
          />

          <ClientDetailsLinkActionsCard
            isArchived={isArchived}
            hasLink={Boolean(link)}
            linksLoading={linksLoading}
            archiveLoading={setLinkStatusLoading}
            deleteLoading={deleteLoading}
            onArchive={toggleArchive}
            onDelete={() =>
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
          />

          {(linksLoading || profileLoading) &&
          (upsertLoading || markCheckInLoading) ? (
            <LoadingSpinner />
          ) : null}
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
