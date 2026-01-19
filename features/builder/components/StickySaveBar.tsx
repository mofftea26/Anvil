import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, useTheme } from "@/shared/ui";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

type Props = {
  onSave: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
};

export function StickySaveBar({ onSave, onDiscard, isSaving }: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom:12,
          backgroundColor: theme.colors.surface2,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Button
          variant="secondary"
          fullWidth
          style={{ flex: 1 }}
          onPress={onDiscard}
        >
          {t("common.discard")}
        </Button>

        <View style={{ width: 10 }} />

        <Button
          variant="primary"
          fullWidth
          style={{ flex: 1 }}
          onPress={onSave}
          isLoading={isSaving}
        >
          {t("common.save")}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,

    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
