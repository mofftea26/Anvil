import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import type { ProgramTemplate } from "@/features/library/types/programTemplate";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

export function ProgramTemplateCardInfoModal(props: {
  visible: boolean;
  template: ProgramTemplate;
  onClose: () => void;
}) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Modal visible={props.visible} transparent animationType="fade">
      <Pressable
        style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        onPress={props.onClose}
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.header, { borderBottomColor: theme.colors.border }]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: hexToRgba(theme.colors.accent, 0.12) },
              ]}
            >
              <Icon
                name="information-circle-outline"
                size={28}
                color={theme.colors.accent}
              />
            </View>
            <Text
              weight="bold"
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {props.template.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {t("library.programsScreen.description", "Description")}
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                styles.body,
                {
                  color: props.template.description
                    ? theme.colors.text
                    : theme.colors.textMuted,
                  fontSize: 15,
                  lineHeight: 22,
                },
              ]}
            >
              {props.template.description ||
                t(
                  "library.programsScreen.noDescription",
                  "No description added."
                )}
            </Text>
          </ScrollView>

          <Pressable
            onPress={props.onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: hexToRgba(theme.colors.accent, 0.15),
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              weight="semibold"
              style={[styles.closeText, { color: theme.colors.accent }]}
            >
              {t("common.close", "Close")}
            </Text>
          </Pressable>
        </Pressable>
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
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: "80%",
  },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scroll: { maxHeight: 280 },
  scrollContent: { padding: 20, paddingTop: 16 },
  body: { textAlign: "center" },
  closeBtn: {
    margin: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 16 },
});
