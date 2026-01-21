import { RefreshControl, View } from "react-native";

import { CreateClientByEmailForm } from "@/features/linking/components/trainer-add-client/CreateClientByEmailForm";
import { InviteCodeSection } from "@/features/linking/components/trainer-add-client/InviteCodeSection";
import { RequestsInboxList } from "@/features/linking/components/trainer-add-client/RequestsInboxList";
import { TrainerAddClientTabSwitch } from "@/features/linking/components/trainer-add-client/TrainerAddClientTabSwitch";
import { useTrainerAddClient } from "@/features/linking/hooks/trainer-add-client/useTrainerAddClient";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  KeyboardScreen,
  StickyHeader,
  useStickyHeaderHeight,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function TrainerAddClientScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const {
    tab,
    setTab,
    generateInvite,
    generatedCode,
    createInviteState,
    inboxLoading,
    pendingRequests,
    onAccept,
    onDecline,
    clientEmail,
    setClientEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    onCreateClient,
    createClientState,
    onRefresh,
    refreshing,
  } = useTrainerAddClient();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader title={t("linking.addClient.title")} showBackButton />
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
        <VStack
          style={{
            backgroundColor: theme.colors.background,
            gap: theme.spacing.lg,
          }}
        >
          <TrainerAddClientTabSwitch value={tab} onChange={setTab} />

          {tab === "invite" ? (
            <InviteCodeSection
              generatedCode={generatedCode}
              isGenerating={createInviteState.isLoading}
              onGenerate={generateInvite}
            />
          ) : null}

          {tab === "requests" ? (
            <RequestsInboxList
              requests={pendingRequests}
              isLoading={inboxLoading}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          ) : null}

          {tab === "create" ? (
            <CreateClientByEmailForm
              clientEmail={clientEmail}
              onClientEmailChange={setClientEmail}
              firstName={firstName}
              onFirstNameChange={setFirstName}
              lastName={lastName}
              onLastNameChange={setLastName}
              onSubmit={onCreateClient}
              isLoading={createClientState.isLoading}
            />
          ) : null}
        </VStack>
      </KeyboardScreen>
    </View>
  );
}
