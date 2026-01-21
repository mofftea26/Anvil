import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { hexToRgba } from "@/features/linking/utils/coachFormatting";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Text, useTheme } from "@/shared/ui";

type RedeemCodeScannerProps = {
  visible: boolean;
  onCodeScanned: (code: string) => void;
  onClose: () => void;
};

export function RedeemCodeScanner({
  visible,
  onCodeScanned,
  onClose,
}: RedeemCodeScannerProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const hasScanned = useRef(false);

  useEffect(() => {
    if (visible) hasScanned.current = false;
  }, [visible]);

  const handleBarcodeScanned = (result: { data?: string }) => {
    const data = result?.data?.trim();
    if (hasScanned.current || !data) return;
    hasScanned.current = true;
    onCodeScanned(data);
  };

  const handleClose = () => {
    hasScanned.current = false;
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text
            weight="semibold"
            style={{ fontSize: 17, color: theme.colors.text }}
          >
            {t("linking.findTrainer.scanQR")}
          </Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={{ color: theme.colors.accent, fontSize: 17 }}>
              {t("common.cancel")}
            </Text>
          </Pressable>
        </View>

        {!permission ? (
          <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.textMuted }}>{t("common.loading")}</Text>
          </View>
        ) : !permission.granted ? (
          <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
            <Text
              style={{
                color: theme.colors.text,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {t("linking.findTrainer.cameraPermissionRequired")}
            </Text>
            <Button onPress={() => void requestPermission()}>
              {t("linking.findTrainer.grantCameraPermission")}
            </Button>
            <Button variant="secondary" onPress={handleClose} style={{ marginTop: 12 }}>
              {t("common.cancel")}
            </Button>
          </View>
        ) : (
          <View style={[styles.cameraWrap, { backgroundColor: theme.colors.background }]}>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            <View style={styles.overlay} pointerEvents="none">
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: hexToRgba(theme.colors.background, 0.25),
                  },
                ]}
              />
              <View
                style={[
                  styles.frame,
                  { borderColor: theme.colors.accent },
                ]}
              />
              <Text style={[styles.hint, { color: theme.colors.text }]}>
                {t("linking.findTrainer.pointAtQR")}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cameraWrap: { flex: 1, position: "relative" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
  },
  hint: {
    position: "absolute",
    bottom: 48,
    fontSize: 15,
    textAlign: "center",
  },
});
