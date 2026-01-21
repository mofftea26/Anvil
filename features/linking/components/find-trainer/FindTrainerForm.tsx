import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, useTheme, VStack } from "@/shared/ui";

type FindTrainerFormProps = {
  trainerEmail: string;
  onTrainerEmailChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function FindTrainerForm({
  trainerEmail,
  onTrainerEmailChange,
  message,
  onMessageChange,
  onSubmit,
  isLoading,
}: FindTrainerFormProps) {
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
