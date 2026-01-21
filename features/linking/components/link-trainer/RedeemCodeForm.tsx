import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, useTheme, VStack } from "@/shared/ui";

type RedeemCodeFormProps = {
  code: string;
  onCodeChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function RedeemCodeForm({
  code,
  onCodeChange,
  onSubmit,
  isLoading,
}: RedeemCodeFormProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card>
      <VStack style={{ gap: theme.spacing.md }}>
        <AppInput
          label={t("linking.client.inviteCode")}
          value={code}
          onChangeText={onCodeChange}
          placeholder={t("linking.placeholders.inviteCode")}
          autoCapitalize="characters"
        />
        <Button isLoading={isLoading} onPress={onSubmit}>
          {t("linking.client.redeem")}
        </Button>
      </VStack>
    </Card>
  );
}
