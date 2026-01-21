import { router } from "expo-router";
import { View } from "react-native";

import { LinkTrainerTabSwitch } from "@/features/linking/components/link-trainer/LinkTrainerTabSwitch";
import { RedeemCodeForm } from "@/features/linking/components/link-trainer/RedeemCodeForm";
import { RequestTrainerForm } from "@/features/linking/components/link-trainer/RequestTrainerForm";
import { RequestTrainerRequestsList } from "@/features/linking/components/link-trainer/RequestTrainerRequestsList";
import { useLinkTrainer } from "@/features/linking/hooks/link-trainer/useLinkTrainer";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  StickyHeader,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function LinkTrainerScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const {
    tab,
    switchTab,
    code,
    setCode,
    trainerEmail,
    setTrainerEmail,
    message,
    setMessage,
    inlineError,
    onRedeem,
    onRequest,
    onCancelRequest,
    redeemState,
    requestState,
    myRequests,
  } = useLinkTrainer();

  return (
    <VStack style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("linking.client.linkTrainer")}
        showBackButton
        rightButton={{
          label: t("common.close"),
          onPress: () => router.back(),
          variant: "secondary",
        }}
      />
      <VStack
        style={{
          flex: 1,
          padding: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
      >
        <LinkTrainerTabSwitch tab={tab} onSwitch={switchTab} />

        {inlineError ? (
          <Text color={theme.colors.danger}>{inlineError}</Text>
        ) : null}

        {tab === "redeem" ? (
          <RedeemCodeForm
            code={code}
            onCodeChange={setCode}
            onSubmit={onRedeem}
            isLoading={redeemState.isLoading}
          />
        ) : (
          <VStack style={{ gap: theme.spacing.lg }}>
            <RequestTrainerForm
              trainerEmail={trainerEmail}
              onTrainerEmailChange={setTrainerEmail}
              message={message}
              onMessageChange={setMessage}
              onSubmit={onRequest}
              isLoading={requestState.isLoading}
            />
            <RequestTrainerRequestsList
              requests={myRequests}
              onCancel={onCancelRequest}
            />
          </VStack>
        )}

        <View style={{ height: 6 }} />
      </VStack>
    </VStack>
  );
}
