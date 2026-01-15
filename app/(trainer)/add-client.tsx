import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { RefreshControl, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import {
  useAcceptTrainerRequestMutation,
  useCreateClientByEmailMutation,
  useCreateTrainerInviteMutation,
  useDeclineTrainerRequestMutation,
  useGetTrainerRequestsInboxQuery,
} from "../../src/features/linking/api/linkingApiSlice";
import { mapLinkingError } from "../../src/features/linking/utils/linkingErrors";
import { useMyProfile } from "../../src/features/profile/hooks/useMyProfile";
import { AppInput } from "../../src/shared/components/AppInput";
import { KeyboardScreen } from "../../src/shared/components/KeyboardScreen";
import { useAppSelector } from "../../src/shared/hooks/useAppSelector";
import { useAppTranslation } from "../../src/shared/i18n/useAppTranslation";
import { appToast, Button, Card, Divider, HStack, IconButton, Text, useTheme, VStack } from "../../src/shared/ui";

type Tab = "invite" | "requests" | "create";

function Segmented({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const items: { key: Tab; label: string }[] = [
    { key: "invite", label: t("linking.addClient.inviteCode") },
    { key: "requests", label: t("linking.addClient.requests") },
    { key: "create", label: t("linking.addClient.createByEmail") },
  ];

  return (
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
      {items.map((it) => (
        <Button
          key={it.key}
          variant="ghost"
          height={42}
          style={{
            flex: 1,
            borderRadius: theme.radii.md,
            backgroundColor: value === it.key ? theme.colors.surface2 : "transparent",
            borderColor: "transparent",
          }}
          onPress={() => onChange(it.key)}
        >
          {it.label}
        </Button>
      ))}
    </HStack>
  );
}

export default function AddClientScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);
  const { me } = useMyProfile();

  const [tab, setTab] = React.useState<Tab>("invite");

  const trainerId = auth.userId ?? "";
  const trainerEmail = me?.email ?? "";

  const [createInvite, createInviteState] = useCreateTrainerInviteMutation();
  const [generatedCode, setGeneratedCode] = React.useState<string>("");
  const didAutoGenerate = React.useRef(false);

  const { data: inbox, isLoading: inboxLoading, refetch: refetchInbox } =
    useGetTrainerRequestsInboxQuery(
      { trainerEmail },
      { skip: !trainerEmail }
    );
  const [acceptReq] = useAcceptTrainerRequestMutation();
  const [declineReq] = useDeclineTrainerRequestMutation();

  const [createClient, createClientState] = useCreateClientByEmailMutation();
  const [clientEmail, setClientEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  const generateInvite = React.useCallback(async () => {
    try {
      const invite = await createInvite({ targetEmail: null, expiresAt: null }).unwrap();
      setGeneratedCode(invite.code);
    } catch (e: any) {
      appToast.error(mapLinkingError(e?.message));
    }
  }, [createInvite]);

  React.useEffect(() => {
    if (!trainerId) return;
    if (didAutoGenerate.current) return;
    didAutoGenerate.current = true;
    void generateInvite();
  }, [trainerId, generateInvite]);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetchInbox();
    } finally {
      setRefreshing(false);
    }
  }, [refetchInbox]);

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
      <VStack style={{ backgroundColor: theme.colors.background, gap: theme.spacing.lg }}>
        <HStack align="center" justify="space-between">
          <Text variant="title" weight="bold">
            {t("linking.addClient.title")}
          </Text>
          <Button variant="secondary" height={42} onPress={() => router.back()}>
            {t("common.close")}
          </Button>
        </HStack>

        <Segmented value={tab} onChange={setTab} />

      {tab === "invite" ? (
        <VStack style={{ gap: theme.spacing.md }}>
          <Card>
            <VStack style={{ gap: theme.spacing.sm }}>
              <Text weight="bold">{t("linking.invite.generate")}</Text>
              <Text muted>{t("linking.invite.shareMessage")}</Text>

              <Button
                isLoading={createInviteState.isLoading}
                onPress={() => void generateInvite()}
                left={<Ionicons name="key-outline" size={18} color={theme.colors.background} />}
              >
                {t("linking.invite.generate")}
              </Button>
            </VStack>
          </Card>

          {generatedCode || createInviteState.isLoading ? (
            <Card>
              <VStack style={{ gap: theme.spacing.sm, alignItems: "center" }}>
                <Text weight="bold">QR</Text>
                {generatedCode ? (
                  <QRCode
                    value={generatedCode}
                    size={190}
                    backgroundColor={theme.colors.surface2}
                    color={theme.colors.text}
                  />
                ) : (
                  <Text muted>{t("common.loading")}</Text>
                )}
              </VStack>
            </Card>
          ) : null}

          {generatedCode ? (
            <Card>
              <HStack align="center" justify="space-between">
                <VStack style={{ flex: 1 }}>
                  <Text variant="caption" muted>
                    {t("linking.invite.code")}
                  </Text>
                  <Text weight="bold" style={{ fontSize: 18, letterSpacing: 1 }}>
                    {generatedCode}
                  </Text>
                </VStack>
                <IconButton
                  icon={<Ionicons name="copy-outline" size={18} color={theme.colors.text} />}
                  onPress={async () => {
                    await Clipboard.setStringAsync(generatedCode);
                    appToast.success(t("linking.invite.copied"));
                  }}
                />
              </HStack>
            </Card>
          ) : null}

        </VStack>
      ) : null}

      {tab === "requests" ? (
        <VStack style={{ gap: theme.spacing.md }}>
          <Text weight="bold">{t("linking.requests.title")}</Text>

          {inboxLoading ? <Text muted>{t("common.loading")}</Text> : null}

          {!inboxLoading && (!inbox?.length || inbox.filter((r) => r.status === "pending").length === 0) ? (
            <Card>
              <Text muted>{t("linking.requests.empty")}</Text>
            </Card>
          ) : (
            <VStack style={{ gap: 10 }}>
              {inbox
                ?.filter((r) => r.status === "pending")
                .map((r) => (
                  <Card key={r.id}>
                    <VStack style={{ gap: 10 }}>
                      <Text weight="bold">{r.clientId}</Text>
                      {r.message ? <Text muted>{r.message}</Text> : null}
                      <Divider opacity={0.6} />
                      <HStack gap={10}>
                        <Button
                          fullWidth
                          style={{ flex: 1 }}
                          onPress={async () => {
                            try {
                              await acceptReq({ requestId: r.id }).unwrap();
                              appToast.success(t("linking.requests.accept"));
                              await refetchInbox();
                            } catch (e: any) {
                              appToast.error(mapLinkingError(e?.message));
                            }
                          }}
                        >
                          {t("linking.requests.accept")}
                        </Button>
                        <Button
                          variant="secondary"
                          fullWidth
                          style={{ flex: 1 }}
                          onPress={async () => {
                            try {
                              await declineReq({ requestId: r.id }).unwrap();
                              appToast.info(t("linking.requests.decline"));
                              await refetchInbox();
                            } catch (e: any) {
                              appToast.error(mapLinkingError(e?.message));
                            }
                          }}
                        >
                          {t("linking.requests.decline")}
                        </Button>
                      </HStack>
                    </VStack>
                  </Card>
                ))}
            </VStack>
          )}
        </VStack>
      ) : null}

      {tab === "create" ? (
        <Card>
          <VStack style={{ gap: theme.spacing.md }}>
            <Text weight="bold">{t("linking.addClient.createByEmail")}</Text>
            <AppInput
              label={t("auth.email")}
              value={clientEmail}
              onChangeText={setClientEmail}
              placeholder="client@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <HStack gap={10}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label={t("auth.firstName")}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label={t("auth.lastName")}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                />
              </View>
            </HStack>
            <Button
              isLoading={createClientState.isLoading}
              onPress={async () => {
                try {
                  await createClient({
                    clientEmail: clientEmail.trim(),
                    firstName: firstName.trim() || undefined,
                    lastName: lastName.trim() || undefined,
                    sendMagicLink: true,
                  }).unwrap();
                  appToast.success(t("linking.clients.addClient"));
                  router.back();
                } catch (e: any) {
                  appToast.error(mapLinkingError(e?.message));
                }
              }}
            >
              {t("common.add")}
            </Button>
          </VStack>
        </Card>
      ) : null}
      </VStack>
    </KeyboardScreen>
  );
}

