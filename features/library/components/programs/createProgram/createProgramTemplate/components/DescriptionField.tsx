import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

export function DescriptionField(props: {
  description: string;
  onChangeDescription: (v: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Pressable onPress={props.onToggleExpanded} style={styles.expandRow}>
        <Text
          style={[
            styles.fieldLabel,
            { color: theme.colors.textMuted, marginBottom: 0 },
          ]}
        >
          {t(
            "library.createProgram.descriptionLabel",
            "Description (optional)"
          )}
        </Text>
        <Icon
          name={props.expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.colors.textMuted}
        />
      </Pressable>
      {props.expanded && (
        <TextInput
          value={props.description}
          onChangeText={props.onChangeDescription}
          placeholder={t(
            "library.createProgram.descriptionPlaceholder",
            "Brief description"
          )}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              marginTop: 10,
            },
          ]}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: { minHeight: 96, textAlignVertical: "top" },
});
