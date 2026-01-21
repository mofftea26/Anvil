import { RefreshControl, View } from "react-native";

import { ClientCoachCard } from "@/features/linking/components/client-coach/ClientCoachCard";
import { ClientCoachCertsCard } from "@/features/linking/components/client-coach/ClientCoachCertsCard";
import { ClientCoachNotLinked } from "@/features/linking/components/client-coach/ClientCoachNotLinked";
import { useClientCoach } from "@/features/linking/hooks/client-coach/useClientCoach";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  KeyboardScreen,
  LoadingSpinner,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  useAppAlert,
  useStickyHeaderHeight,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function ClientCoachScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const alert = useAppAlert();

  const {
    data,
    isLoading,
    error,
    refreshing,
    onRefresh,
    coachName,
    relationshipStatus,
    nextCheckIn,
    certs,
    brandA,
    brandB,
    doPause,
    doResume,
    doDisconnect,
    isPauseResumeLoading,
    isDisconnectLoading,
  } = useClientCoach();

  const onPause = () =>
    alert.confirm({
      title: t("linking.coach.pause"),
      message: t("common.areYouSure"),
      confirmText: t("linking.coach.pause"),
      cancelText: t("common.cancel"),
      onConfirm: () => void doPause(),
    });

  const onResume = () =>
    alert.confirm({
      title: t("linking.coach.resume"),
      message: t("common.areYouSure"),
      confirmText: t("linking.coach.resume"),
      cancelText: t("common.cancel"),
      onConfirm: () => void doResume(),
    });

  const onDisconnect = () =>
    alert.confirm({
      title: t("linking.coach.disconnect"),
      message: t("common.areYouSure"),
      confirmText: t("linking.coach.disconnect"),
      cancelText: t("common.cancel"),
      destructive: true,
      onConfirm: () => void doDisconnect(),
    });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />

      <StickyHeader
        title={t("linking.coach.title")}
        subtitle={t("linking.coach.subtitle")}
      />

      <KeyboardScreen
        bottomSpace={12}
        headerHeight={useStickyHeaderHeight({ subtitle: true })}
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
        {error ? (
          <Text color={theme.colors.danger}>
            {(error as { message?: string })?.message ?? t("auth.errors.generic")}
          </Text>
        ) : null}

        {isLoading ? <LoadingSpinner /> : null}

        {!isLoading && !data ? <ClientCoachNotLinked /> : null}

        {data ? (
          <VStack style={{ gap: theme.spacing.lg }}>
            <ClientCoachCard
              data={data}
              coachName={coachName}
              nextCheckIn={nextCheckIn}
              relationshipStatus={relationshipStatus}
              brandA={brandA}
              brandB={brandB}
              onPause={onPause}
              onResume={onResume}
              onDisconnect={onDisconnect}
              isPauseResumeLoading={isPauseResumeLoading}
              isDisconnectLoading={isDisconnectLoading}
            />
            <ClientCoachCertsCard certs={certs} />
          </VStack>
        ) : null}
      </KeyboardScreen>
    </View>
  );
}
