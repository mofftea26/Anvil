import React from "react";
import { View } from "react-native";

import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, Icon, Text, useTheme, VStack } from "@/shared/ui";

type FindTrainerRedeemCodeProps = {
  redeemCode: string;
  onRedeemCodeChange: (v: string) => void;
  onRedeem: () => void;
  onScanQR: () => void;
  isLoading: boolean;
};

export function FindTrainerRedeemCode({
  redeemCode,
  onRedeemCodeChange,
  onRedeem,
  onScanQR,
  isLoading,
}: FindTrainerRedeemCodeProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card>
      <VStack style={{ gap: theme.spacing.md }}>
        <Button
          variant="secondary"
          onPress={onScanQR}
          left={
            <Icon
              name="qr-code-outline"
              size={20}
              color={theme.colors.text}
              strokeWidth={1.5}
            />
          }
        >
          {t("linking.findTrainer.scanQR")}
        </Button>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
            {t("linking.findTrainer.orEnterManually")}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
        </View>

        <AppInput
          label={t("linking.client.inviteCode")}
          value={redeemCode}
          onChangeText={onRedeemCodeChange}
          placeholder={t("linking.placeholders.inviteCode")}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button isLoading={isLoading} onPress={onRedeem}>
          {t("linking.client.redeem")}
        </Button>
      </VStack>
    </Card>
  );
}
