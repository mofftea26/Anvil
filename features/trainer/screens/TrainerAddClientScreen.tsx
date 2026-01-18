import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { RefreshControl, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { useTrainerAddClient, type Tab } from "@/features/trainer/hooks/useTrainerAddClient";
import { AppInput } from "@/shared/components/AppInput";
import { KeyboardScreen } from "@/shared/components/KeyboardScreen";
import {
  Button,
  Card,
  Divider,
  HStack,
  IconButton,
  LoadingSpinner,
  StickyHeader,
  Text,
  VStack,
} from "@/shared/ui";

type SegmentedItem = { key: Tab; label: string };

type SegmentedProps = {
  value: Tab;
  onChange: (v: Tab) => void;
  items: SegmentedItem[];
  theme: ReturnType<typeof useTrainerAddClient>["theme"];
};

function Segmented({ value, onChange, items, theme }: SegmentedProps) {
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
            backgroundColor:
              value === it.key ? theme.colors.surface2 : "transparent",
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

export default function TrainerAddClientScreen() {
  const {
    t,
    theme,
    headerHeight,
    tab,
    setTab,
    generatedCode,
    createInviteState,
    inboxLoading,
    pendingRequests,
    refreshing,
    onRefresh,
    generateInvite,
    onCopyCode,
    onAcceptRequest,
    onDeclineRequest,
    form,
    updateForm,
    onCreateClient,
    createClientState,
    segmentedItems,
  } = useTrainerAddClient();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader title={t("linking.addClient.title")} showBackButton />
      <KeyboardScreen
        bottomSpace={12}
        headerHeight={headerHeight}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
      >
        <VStack
          style={{
            backgroundColor: theme.colors.background,
            gap: theme.spacing.lg,
          }}
        >
          <Segmented
            value={tab}
            onChange={setTab}
            items={segmentedItems}
            theme={theme}
          />

          {tab === "invite" ? (
            <VStack style={{ gap: theme.spacing.md }}>
              <Card>
                <VStack style={{ gap: theme.spacing.sm }}>
                  <Text weight="bold">{t("linking.invite.generate")}</Text>
                  <Text muted>{t("linking.invite.shareMessage")}</Text>

                  <Button
                    isLoading={createInviteState.isLoading}
                    onPress={() => void generateInvite()}
                    left={
                      <Ionicons
                        name="key-outline"
                        size={18}
                        color={theme.colors.background}
                      />
                    }
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
                      <LoadingSpinner />
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
                      icon={
                        <Ionicons
                          name="copy-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                      }
                      onPress={() => void onCopyCode()}
                    />
                  </HStack>
                </Card>
              ) : null}
            </VStack>
          ) : null}

          {tab === "requests" ? (
            <VStack style={{ gap: theme.spacing.md }}>
              <Text weight="bold">{t("linking.requests.title")}</Text>

              {inboxLoading ? <LoadingSpinner /> : null}

              {!inboxLoading && !pendingRequests.length ? (
                <Card>
                  <Text muted>{t("linking.requests.empty")}</Text>
                </Card>
              ) : (
                <VStack style={{ gap: 10 }}>
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <VStack style={{ gap: 10 }}>
                        <Text weight="bold">{request.clientId}</Text>
                        {request.message ? (
                          <Text muted>{request.message}</Text>
                        ) : null}
                        <Divider opacity={0.6} />
                        <HStack gap={10}>
                          <Button
                            fullWidth
                            style={{ flex: 1 }}
                            onPress={() =>
                              void onAcceptRequest(request.id)
                            }
                          >
                            {t("linking.requests.accept")}
                          </Button>
                          <Button
                            variant="secondary"
                            fullWidth
                            style={{ flex: 1 }}
                            onPress={() =>
                              void onDeclineRequest(request.id)
                            }
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
                  value={form.clientEmail}
                  onChangeText={(value) => updateForm("clientEmail", value)}
                  placeholder="client@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <HStack gap={10}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label={t("auth.firstName")}
                      value={form.firstName}
                      onChangeText={(value) => updateForm("firstName", value)}
                      placeholder="John"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      label={t("auth.lastName")}
                      value={form.lastName}
                      onChangeText={(value) => updateForm("lastName", value)}
                      placeholder="Doe"
                    />
                  </View>
                </HStack>
                <Button
                  isLoading={createClientState.isLoading}
                  onPress={() => void onCreateClient()}
                >
                  {t("common.add")}
                </Button>
              </VStack>
            </Card>
          ) : null}
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
