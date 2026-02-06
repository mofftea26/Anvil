import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, useTheme } from "@/shared/ui";

export function CreateTemplateFooter(props: {
  onSubmit: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <Button
        onPress={props.onSubmit}
        disabled={props.disabled}
        isLoading={props.loading}
        style={styles.cta}
      >
        {t("library.createProgram.createAndEdit", "Create & Edit")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {},
  cta: { width: "100%" },
});
