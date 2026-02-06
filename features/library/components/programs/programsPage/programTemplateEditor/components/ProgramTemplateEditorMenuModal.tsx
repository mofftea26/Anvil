import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Text, useTheme } from "@/shared/ui";

export function ProgramTemplateEditorMenuModal(props: {
  visible: boolean;
  onClose: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Modal visible={props.visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={props.onClose}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface2 }]}>
          <Pressable
            style={[styles.item, { borderBottomColor: theme.colors.border }]}
            onPress={props.onDuplicate}
          >
            <Text style={{ color: theme.colors.text }}>
              {t("library.programsScreen.menuDuplicate")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.item, { borderBottomColor: theme.colors.border }]}
            onPress={props.onArchive}
          >
            <Text style={{ color: theme.colors.text }}>
              {t("library.programsScreen.menuArchive")}
            </Text>
          </Pressable>
          <Pressable style={styles.item} onPress={props.onDelete}>
            <Text style={{ color: theme.colors.danger }}>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
  },
  card: { borderRadius: 20, minWidth: 240, overflow: "hidden" },
  item: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
});

