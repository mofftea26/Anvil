import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, useTheme, VStack } from "@/shared/ui";

type RequestTrainerFormProps = {
  trainerEmail: string;
  onTrainerEmailChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function RequestTrainerForm({
  trainerEmail,
  onTrainerEmailChange,
  message,
  onMessageChange,
  onSubmit,
  isLoading,
}: RequestTrainerFormProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card>
      <VStack style={{ gap: theme.spacing.md }}>
        <AppInput
          label={t("linking.client.trainerEmail")}
          value={trainerEmail}
          onChangeText={onTrainerEmailChange}
          placeholder={t("common.placeholders.email")}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label={t("linking.client.message")}
          value={message}
          onChangeText={onMessageChange}
          placeholder={t("linking.client.message")}
          multiline
          autoGrow
        />
        <Button isLoading={isLoading} onPress={onSubmit}>
          {t("linking.client.sendRequest")}
        </Button>
      </VStack>
    </Card>
  );
}
