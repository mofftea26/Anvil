import { router } from "expo-router";
import React from "react";
import { View } from "react-native";

import {
  useCancelTrainerRequestMutation,
  useCreateTrainerRequestMutation,
  useGetClientRequestsQuery,
  useRedeemInviteCodeMutation,
} from "../../src/features/linking/api/linkingApiSlice";
import { mapLinkingError } from "../../src/features/linking/utils/linkingErrors";
import { AppInput } from "../../src/shared/components/AppInput";
import { useAppSelector } from "../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";
import { appToast, Button, Card, Divider, HStack, Text, useTheme, VStack } from "../../src/shared/ui";

type Tab = "redeem" | "request";

export default function LinkTrainerScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);

  const clientId = auth.userId ?? "";

  const [tab, setTab] = React.useState<Tab>("redeem");
  const [code, setCode] = React.useState("");
  const [trainerEmail, setTrainerEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  const [redeem, redeemState] = useRedeemInviteCodeMutation();
  const [requestTrainer, requestState] = useCreateTrainerRequestMutation();
  const [cancelReq] = useCancelTrainerRequestMutation();

  const { data: myRequests, refetch: refetchRequests } = useGetClientRequestsQuery(
    { clientId },
    { skip: !clientId }
  );

  return (
    <VStack
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
      }}
    >
      <HStack align="center" justify="space-between">
        <Text variant="title" weight="bold">
          {t("linking.client.linkTrainer")}
        </Text>
        <Button variant="secondary" height={42} onPress={() => router.back()}>
          {t("common.close")}
        </Button>
      </HStack>

      <HStack
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          padding: 6,
          gap: 6,
        }}
      >
        <Button
          variant="ghost"
          height={42}
          style={{
            flex: 1,
            borderRadius: theme.radii.md,
            backgroundColor: tab === "redeem" ? theme.colors.surface2 : "transparent",
            borderColor: "transparent",
          }}
          onPress={() => {
            setInlineError(null);
            setTab("redeem");
          }}
        >
          {t("linking.client.redeemTitle")}
        </Button>
        <Button
          variant="ghost"
          height={42}
          style={{
            flex: 1,
            borderRadius: theme.radii.md,
            backgroundColor: tab === "request" ? theme.colors.surface2 : "transparent",
            borderColor: "transparent",
          }}
          onPress={() => {
            setInlineError(null);
            setTab("request");
          }}
        >
          {t("linking.client.requestTitle")}
        </Button>
      </HStack>

      {inlineError ? <Text color={theme.colors.accent2}>{inlineError}</Text> : null}

      {tab === "redeem" ? (
        <Card>
          <VStack style={{ gap: theme.spacing.md }}>
            <AppInput
              label={t("linking.client.inviteCode")}
              value={code}
              onChangeText={setCode}
              placeholder="ABC123"
              autoCapitalize="characters"
            />
            <Button
              isLoading={redeemState.isLoading}
              onPress={async () => {
                setInlineError(null);
                try {
                  await redeem({ code: code.trim() }).unwrap();
                  appToast.success(t("linking.client.redeem"));
                  router.replace("/"); // client home
                } catch (e: any) {
                  const msg = mapLinkingError(e?.message);
                  setInlineError(msg);
                  appToast.error(msg);
                }
              }}
            >
              {t("linking.client.redeem")}
            </Button>
          </VStack>
        </Card>
      ) : (
        <VStack style={{ gap: theme.spacing.lg }}>
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
                placeholder={t("linking.client.message")}
                multiline
                autoGrow
              />
              <Button
                isLoading={requestState.isLoading}
                onPress={async () => {
                  setInlineError(null);
                  try {
                    await requestTrainer({
                      trainerEmail: trainerEmail.trim(),
                      message: message.trim() || null,
                    }).unwrap();
                    appToast.success(t("linking.client.sendRequest"));
                    await refetchRequests();
                  } catch (e: any) {
                    const msg = mapLinkingError(e?.message);
                    setInlineError(msg);
                    appToast.error(msg);
                  }
                }}
              >
                {t("linking.client.sendRequest")}
              </Button>
            </VStack>
          </Card>

          {myRequests?.length ? (
            <VStack style={{ gap: 10 }}>
              <Text weight="bold">{t("linking.requests.title")}</Text>
              {myRequests.map((r) => (
                <Card key={r.id}>
                  <VStack style={{ gap: 10 }}>
                    <HStack align="center" justify="space-between">
                      <Text weight="bold">{r.trainerEmail}</Text>
                      <Text muted>{r.status}</Text>
                    </HStack>
                    {r.message ? <Text muted>{r.message}</Text> : null}
                    {r.status === "pending" ? (
                      <>
                        <Divider opacity={0.6} />
                        <Button
                          variant="secondary"
                          onPress={async () => {
                            try {
                              await cancelReq({ requestId: r.id }).unwrap();
                              appToast.info(t("linking.requests.cancel"));
                              await refetchRequests();
                            } catch (e: any) {
                              appToast.error(mapLinkingError(e?.message));
                            }
                          }}
                        >
                          {t("linking.requests.cancel")}
                        </Button>
                      </>
                    ) : null}
                  </VStack>
                </Card>
              ))}
            </VStack>
          ) : null}
        </VStack>
      )}

      <View style={{ height: 6 }} />
    </VStack>
  );
}

