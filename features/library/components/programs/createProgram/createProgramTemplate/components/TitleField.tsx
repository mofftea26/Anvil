import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Text, useTheme } from "@/shared/ui";

export function TitleField(props: {
  title: string;
  onChangeTitle: (v: string) => void;
  minTitleLength: number;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>
        {t("library.createProgram.titleLabel", "Title")} *
      </Text>
      <TextInput
        value={props.title}
        onChangeText={props.onChangeTitle}
        placeholder={t(
          "library.createProgram.titlePlaceholder",
          "Program name"
        )}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
          },
        ]}
        maxLength={100}
      />
      {props.title.length > 0 && props.title.length < props.minTitleLength && (
        <Text style={[styles.hint, { color: theme.colors.danger }]}>
          Min {props.minTitleLength} characters
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: { fontSize: 12, marginTop: 6 },
});
