import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Text, useTheme, VStack, Icon } from "@/shared/ui";

export function AssignTypeSheet(props: {
  visible: boolean;
  onClose: () => void;
  onPickWorkout: () => void;
  onPickProgram: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useAppTranslation();

  return (
    <Modal visible={props.visible} transparent animationType="fade">
      <View style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={props.onClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <VStack style={{ gap: 12, alignItems: "center" }}>
            <Text weight="bold" style={{ fontSize: 18, textAlign: "center" }}>
              {t("clients.assign", "Assign")}
            </Text>
            <Text muted style={{ textAlign: "center", lineHeight: 20 }}>
              {t("clients.assignPickType", "What would you like to assign?")}
            </Text>

            <VStack style={{ gap: 10, width: "100%", marginTop: 6 }}>
              <Button
                fullWidth
                height={48}
                onPress={() => {
                  props.onClose();
                  props.onPickWorkout();
                }}
                left={<Icon name="barbell-outline" size={18} color={theme.colors.text} />}
              >
                {t("clients.workout", "Workout")}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                height={48}
                onPress={() => {
                  props.onClose();
                  props.onPickProgram();
                }}
                left={<Icon name="layers-outline" size={18} color={theme.colors.text} />}
              >
                {t("clients.program", "Program")}
              </Button>
              <Button
                variant="ghost"
                fullWidth
                height={44}
                onPress={props.onClose}
              >
                {t("common.cancel", "Cancel")}
              </Button>
            </VStack>
          </VStack>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
});

