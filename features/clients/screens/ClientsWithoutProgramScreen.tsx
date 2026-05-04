import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { AssignToClientsSheet } from "@/features/clients/components/assignments/AssignToClientsSheet";
import { ChooseProgramTemplateSheet } from "@/features/clients/components/assignments/ChooseProgramTemplateSheet";
import { ClientNoProgramRow } from "@/features/clients/components/no-program/ClientNoProgramRow";
import { useClientsWithoutActiveProgram } from "@/features/clients/hooks/useClientsWithoutActiveProgram";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  getScreenHorizontalPadding,
  Icon,
  LoadingSpinner,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function ClientsWithoutProgramScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const screenPadding = getScreenHorizontalPadding(theme);
  const { rows, loading, refreshing, error, onRefresh } = useClientsWithoutActiveProgram();

  const [chooseProgramOpen, setChooseProgramOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [programItem, setProgramItem] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (error) appToast.error(error);
  }, [error]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        showBackButton
        title={t("trainer.noProgram.screenTitle", "Clients without a program")}
        subtitle={t("trainer.noProgram.screenSubtitle", "Active clients with no active program assignment")}
        rightButton={{
          onPress: () => void onRefresh(),
          variant: "icon",
          isLoading: refreshing,
          icon: <Icon name="refresh" size={20} color={theme.colors.text} />,
        }}
      />
      {loading && rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.clientId}
          contentContainerStyle={{
            paddingHorizontal: screenPadding,
            paddingTop: 10,
            paddingBottom: 24,
            gap: 12,
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={
            <VStack style={{ alignItems: "center", justifyContent: "center", paddingTop: 48, gap: 8 }}>
              <Icon name="checkmark-circle-outline" size={40} color={theme.colors.textMuted} />
              <Text muted style={{ textAlign: "center" }}>
                {t("trainer.noProgram.empty", "Every active client has a program. Nice work.")}
              </Text>
            </VStack>
          }
          renderItem={({ item }) => (
            <ClientNoProgramRow
              row={item}
              onQuickAssign={() => {
                setSelectedClientId(item.clientId);
                setChooseProgramOpen(true);
              }}
            />
          )}
        />
      )}

      <ChooseProgramTemplateSheet
        visible={chooseProgramOpen}
        onClose={() => setChooseProgramOpen(false)}
        onSelectProgramTemplate={(id, title) => {
          setProgramItem({ id, title });
          setChooseProgramOpen(false);
          setAssignOpen(true);
        }}
      />

      {programItem ? (
        <AssignToClientsSheet
          visible={assignOpen}
          onClose={() => {
            setAssignOpen(false);
            setProgramItem(null);
            setSelectedClientId(null);
          }}
          mode="program"
          item={programItem}
          initialClientIds={selectedClientId ? [selectedClientId] : []}
          onAssigned={() => void onRefresh()}
        />
      ) : null}
    </View>
  );
}
