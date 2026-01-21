import React from "react";
import { View } from "react-native";

import { SetTypesContent } from "@/features/library/components/set-types-dictionary/SetTypesContent";
import { SetTypesTabs } from "@/features/library/components/set-types-dictionary/SetTypesTabs";
import { useSetTypesDictionaryScreen } from "@/features/library/hooks/set-types-dictionary/useSetTypesDictionaryScreen";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { StickyHeader, Text, useTheme } from "@/shared/ui";

export default function SetTypesDictionaryScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const {
    tabs,
    activeTabKey,
    setActiveTabKey,
    activeTab,
    isLoading,
    error,
  } = useSetTypesDictionaryScreen();

  if (isLoading) {
    return (
      <View style={[{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }]}>
        <Text>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }]}>
        <Text>{t("library.setTypesDictionaryScreen.loadError")}</Text>
      </View>
    );
  }

  const rows = activeTab?.rows ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("library.setTypesDictionary", "Set Types Dictionary")}
        showBackButton
      />

      <SetTypesTabs
        tabs={tabs}
        activeTabKey={activeTabKey}
        onSelect={setActiveTabKey}
      />

      <SetTypesContent
        rows={rows}
        emptyLabel={t("library.setTypesDictionaryScreen.empty")}
        getRowKey={(r, i) =>
          r?.id ? String(r.id) : `${activeTab?.key ?? "tab"}-row-${i}`
        }
      />
    </View>
  );
}
