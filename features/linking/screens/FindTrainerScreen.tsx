import { router } from "expo-router";
import { RefreshControl, View } from "react-native";

import { FindTrainerForm } from "@/features/linking/components/find-trainer/FindTrainerForm";
import { FindTrainerRequestsList } from "@/features/linking/components/find-trainer/FindTrainerRequestsList";
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
  } = useFindTrainer();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("linking.coach.findTrainer")}
        showBackButton
        rightButton={{
          label: t("common.close"),
          onPress: () => router.back(),
          variant: "secondary",
        }}
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

          <FindTrainerForm
            trainerEmail={trainerEmail}
            onTrainerEmailChange={setTrainerEmail}
            message={message}
            onMessageChange={setMessage}
            onSubmit={onSubmit}
            isLoading={createReqState.isLoading}
          />

          <FindTrainerRequestsList requests={data} isLoading={isLoading} />

          <View style={{ height: 10 }} />
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
