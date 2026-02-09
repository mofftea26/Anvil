import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Text, useTheme, VStack, HStack } from "@/shared/ui";

export type DuplicateProgramAssignmentMode = "archived" | "active";

export function ProgramAssignmentDuplicateModal(props: {
  visible: boolean;
  dateLabel: string;
  mode: DuplicateProgramAssignmentMode;
  loading?: boolean;
  onCancel: () => void;
  onReactivate?: () => void;
  onReset?: () => void;
  onResetAndReactivate?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useAppTranslation();

  return (
    <Modal visible={props.visible} transparent animationType="fade">
      <View style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={props.onCancel} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <VStack style={{ gap: 10 }}>
            <Text weight="bold" style={{ fontSize: 18, textAlign: "center" }}>
              {t("clients.assign.duplicate.title", "Already assigned for {{date}}", { date: props.dateLabel })}
            </Text>
            <Text muted style={{ textAlign: "center", lineHeight: 20 }}>
              {props.mode === "archived"
                ? t(
                    "clients.assign.duplicate.bodyArchived",
                    "This client already has this program assigned for that date, but it’s archived. You can reactivate it or reset progress and reactivate."
                  )
                : t(
                    "clients.assign.duplicate.bodyActive",
                    "This client already has this program assigned for that date. You can reset progress to start over."
                  )}
            </Text>

            {props.mode === "archived" ? (
              <VStack style={{ gap: 10, marginTop: 6 }}>
                <Button
                  fullWidth
                  height={48}
                  isLoading={props.loading}
                  disabled={props.loading}
                  onPress={props.onReactivate}
                >
                  {t("clients.assign.duplicate.reactivate", "Reactivate")}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  height={48}
                  isLoading={props.loading}
                  disabled={props.loading}
                  onPress={props.onResetAndReactivate}
                >
                  {t("clients.assign.duplicate.resetReactivate", "Reset progress & Reactivate")}
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  height={44}
                  disabled={props.loading}
                  onPress={props.onCancel}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
              </VStack>
            ) : (
              <HStack gap={10} style={{ marginTop: 8 }}>
                <Button
                  variant="secondary"
                  fullWidth
                  style={{ flex: 1 }}
                  height={44}
                  disabled={props.loading}
                  onPress={props.onCancel}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  fullWidth
                  style={{ flex: 1 }}
                  height={44}
                  isLoading={props.loading}
                  disabled={props.loading}
                  onPress={props.onReset}
                >
                  {t("clients.assign.duplicate.reset", "Reset progress")}
                </Button>
              </HStack>
            )}
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
    maxWidth: 520,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
});

