import { router } from "expo-router";
import React from "react";
import { RefreshControl, View } from "react-native";

import {
  useCreateTrainerRequestMutation,
  useGetClientRequestsQuery,
} from "../../src/features/linking/api/linkingApiSlice";
import { AppInput } from "../../src/shared/components/AppInput";
import { KeyboardScreen } from "../../src/shared/components/KeyboardScreen";
import { useAppSelector } from "../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";
import { appToast, Button, Card, Divider, HStack, Text, useTheme, VStack } from "../../src/shared/ui";

export default function FindTrainerScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);
  const clientId = auth.userId ?? "";

  const [trainerEmail, setTrainerEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [createReq, createReqState] = useCreateTrainerRequestMutation();

  const { data, isLoading, error, refetch } = useGetClientRequestsQuery(
    { clientId },
    { skip: !clientId }
  );
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
    <KeyboardScreen
      padding={theme.spacing.lg}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={theme.colors.text}
        />
      }
    >
      <VStack style={{ gap: theme.spacing.lg }}>
        <HStack align="center" justify="space-between">
          <Text variant="title" weight="bold">
            {t("linking.coach.findTrainer")}
          </Text>
          <Button variant="secondary" height={42} onPress={() => router.back()}>
            {t("common.close")}
          </Button>
        </HStack>

        {error ? (
          <Text color={theme.colors.danger}>
            {(error as any)?.message ?? t("auth.errors.generic")}
          </Text>
        ) : null}

        <Card>
          <VStack style={{ gap: theme.spacing.md }}>
            <AppInput
              label={t("linking.client.trainerEmail")}
              value={trainerEmail}
              onChangeText={setTrainerEmail}
              placeholder="trainer@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppInput
              label={t("linking.client.message")}
              value={message}
              onChangeText={setMessage}
              multiline
              autoGrow
            />
            <Button
              isLoading={createReqState.isLoading}
              onPress={async () => {
                try {
                  await createReq({
                    trainerEmail: trainerEmail.trim(),
                    message: message.trim() || null,
                  }).unwrap();
                  appToast.success(t("linking.client.sendRequest"));
                  setMessage("");
                  await refetch();
                } catch (e: any) {
                  appToast.error(e?.message ?? t("auth.errors.generic"));
                }
              }}
            >
              {t("linking.client.sendRequest")}
            </Button>
          </VStack>
        </Card>

        <Card>
          <VStack style={{ gap: 10 }}>
            <Text weight="bold">{t("linking.requests.title")}</Text>
            <Divider opacity={0.6} />

            {isLoading ? <Text muted>{t("common.loading")}</Text> : null}

            {!isLoading && (!data?.length || data.length === 0) ? (
              <Text muted>{t("linking.requests.empty")}</Text>
            ) : (
              <VStack style={{ gap: 10 }}>
                {data?.map((r) => (
                  <Card key={r.id} background="surface2">
                    <VStack style={{ gap: 6 }}>
                      <HStack align="center" justify="space-between">
                        <Text weight="bold">{r.trainerEmail}</Text>
                        <Text muted>{r.status}</Text>
                      </HStack>
                      {r.message ? <Text muted>{r.message}</Text> : null}
                    </VStack>
                  </Card>
                ))}
              </VStack>
            )}
          </VStack>
        </Card>

        <View style={{ height: 10 }} />
      </VStack>
    </KeyboardScreen>
  );
}

