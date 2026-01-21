import React, { useState } from "react";
import { RefreshControl, View } from "react-native";

import { FindTrainerForm } from "@/features/linking/components/find-trainer/FindTrainerForm";
import {
  FindTrainerOptionSwitch,
  type FindTrainerMode,
} from "@/features/linking/components/find-trainer/FindTrainerOptionSwitch";
import { FindTrainerRedeemCode } from "@/features/linking/components/find-trainer/FindTrainerRedeemCode";
import { FindTrainerRequestsList } from "@/features/linking/components/find-trainer/FindTrainerRequestsList";
import { RedeemCodeScanner } from "@/features/linking/components/find-trainer/RedeemCodeScanner";
import { useFindTrainer } from "@/features/linking/hooks/find-trainer/useFindTrainer";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  KeyboardScreen,
  StickyHeader,
  Text,
  useStickyHeaderHeight,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function FindTrainerScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [mode, setMode] = useState<FindTrainerMode>("email");

  const {
    trainerEmail,
    setTrainerEmail,
    message,
    setMessage,
    onSubmit,
    createReqState,
    data,
    isLoading,
    error,
    onRefresh,
    refreshing,
    redeemCode,
    setRedeemCode,
    onRedeemCode,
    redeemState,
    showScanner,
    setShowScanner,
  } = useFindTrainer();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("linking.coach.findTrainer")}
        showBackButton
      />
      <KeyboardScreen
        bottomSpace={12}
        headerHeight={useStickyHeaderHeight()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
      >
        <VStack style={{ gap: theme.spacing.lg }}>
          {error ? (
            <Text color={theme.colors.danger}>
              {(error as { message?: string })?.message ??
                t("auth.errors.generic")}
            </Text>
          ) : null}

          <FindTrainerOptionSwitch
            mode={mode}
            onModeChange={setMode}
            byEmailLabel={t("linking.findTrainer.byEmail")}
            redeemCodeLabel={t("linking.findTrainer.redeemCode")}
          />

          {mode === "email" ? (
            <FindTrainerForm
              trainerEmail={trainerEmail}
              onTrainerEmailChange={setTrainerEmail}
              message={message}
              onMessageChange={setMessage}
              onSubmit={onSubmit}
              isLoading={createReqState.isLoading}
            />
          ) : (
            <FindTrainerRedeemCode
              redeemCode={redeemCode}
              onRedeemCodeChange={setRedeemCode}
              onRedeem={() => onRedeemCode(redeemCode)}
              onScanQR={() => setShowScanner(true)}
              isLoading={redeemState.isLoading}
            />
          )}

          <FindTrainerRequestsList requests={data} isLoading={isLoading} />

          <View style={{ height: 10 }} />
        </VStack>
      </KeyboardScreen>

      <RedeemCodeScanner
        visible={showScanner}
        onCodeScanned={onRedeemCode}
        onClose={() => setShowScanner(false)}
      />
    </View>
  );
}
