import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import React from "react";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  Button,
  Card,
  HStack,
  Icon,
  IconButton,
  LoadingSpinner,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

type InviteCodeSectionProps = {
  generatedCode: string;
  isGenerating: boolean;
  onGenerate: () => void;
};

export function InviteCodeSection({
  generatedCode,
  isGenerating,
  onGenerate,
}: InviteCodeSectionProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <VStack style={{ gap: theme.spacing.md }}>
      <Card>
        <VStack style={{ gap: theme.spacing.sm }}>
          <Text weight="bold">{t("linking.invite.generate")}</Text>
          <Text muted>{t("linking.invite.shareMessage")}</Text>
          <Button
            isLoading={isGenerating}
            onPress={() => void onGenerate()}
            left={
              <Icon
                name="key-outline"
                size={18}
                color={theme.colors.background}
                strokeWidth={1.5}
              />
            }
          >
            {t("linking.invite.generate")}
          </Button>
        </VStack>
      </Card>

      {(generatedCode || isGenerating) && (
        <Card>
          <VStack
            style={{ gap: theme.spacing.sm, alignItems: "center" }}
          >
            <Text weight="bold">{t("common.qr")}</Text>
            {generatedCode ? (
              <QRCode
                value={generatedCode}
                size={190}
                backgroundColor={theme.colors.surface2}
                color={theme.colors.text}
              />
            ) : (
              <LoadingSpinner />
            )}
          </VStack>
        </Card>
      )}

      {generatedCode ? (
        <Card>
          <HStack align="center" justify="space-between">
            <VStack style={{ flex: 1 }}>
              <Text variant="caption" muted>
                {t("linking.invite.code")}
              </Text>
              <Text
                weight="bold"
                style={{ fontSize: 18, letterSpacing: 1 }}
              >
                {generatedCode}
              </Text>
            </VStack>
            <IconButton
              icon={
                <Icon
                  name="copy-outline"
                  size={18}
                  color={theme.colors.text}
                  strokeWidth={1.5}
                />
              }
              onPress={async () => {
                await Clipboard.setStringAsync(generatedCode);
                appToast.success(t("linking.invite.copied"));
              }}
            />
          </HStack>
        </Card>
      ) : null}
    </VStack>
  );
}
