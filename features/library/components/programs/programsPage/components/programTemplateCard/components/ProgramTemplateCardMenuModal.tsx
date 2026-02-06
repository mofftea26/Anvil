import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Text, useTheme } from "@/shared/ui";

export function ProgramTemplateCardMenuModal(props: {
  visible: boolean;
  isArchived: boolean;
  onClose: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Modal visible={props.visible} transparent animationType="fade">
      <Pressable
        style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        onPress={props.onClose}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            style={[styles.item, { borderBottomColor: theme.colors.border }]}
            onPress={props.onDuplicate}
          >
            <Text style={[styles.itemText, { color: theme.colors.text }]}>
              {t("library.programsScreen.menuDuplicate")}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.item, { borderBottomColor: theme.colors.border }]}
            onPress={props.isArchived ? props.onUnarchive : props.onArchive}
          >
            <Text style={[styles.itemText, { color: theme.colors.text }]}>
              {props.isArchived
                ? t("library.programsScreen.menuUnarchive", "Unarchive")
                : t("library.programsScreen.menuArchive")}
            </Text>
          </Pressable>

          <Pressable style={styles.item} onPress={props.onDelete}>
            <Text style={[styles.itemText, { color: theme.colors.danger }]}>
              {t("library.programsScreen.menuDelete")}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 14,
    minWidth: 220,
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
