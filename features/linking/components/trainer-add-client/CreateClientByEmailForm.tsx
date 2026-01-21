import { View } from "react-native";

import { AppInput } from "@/shared/components/AppInput";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, HStack, Text, useTheme, VStack } from "@/shared/ui";

type CreateClientByEmailFormProps = {
  clientEmail: string;
  onClientEmailChange: (v: string) => void;
  firstName: string;
  onFirstNameChange: (v: string) => void;
  lastName: string;
  onLastNameChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function CreateClientByEmailForm({
  clientEmail,
  onClientEmailChange,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  onSubmit,
  isLoading,
}: CreateClientByEmailFormProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card>
      <VStack style={{ gap: theme.spacing.md }}>
        <Text weight="bold">{t("linking.addClient.createByEmail")}</Text>
        <AppInput
          label={t("auth.email")}
          value={clientEmail}
          onChangeText={onClientEmailChange}
          placeholder={t("common.placeholders.email")}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <HStack gap={10}>
          <View style={{ flex: 1 }}>
            <AppInput
              label={t("auth.firstName")}
              value={firstName}
              onChangeText={onFirstNameChange}
              placeholder={t("common.placeholders.firstName")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label={t("auth.lastName")}
              value={lastName}
              onChangeText={onLastNameChange}
              placeholder={t("common.placeholders.lastName")}
            />
          </View>
        </HStack>
        <Button isLoading={isLoading} onPress={onSubmit}>
          {t("common.add")}
        </Button>
      </VStack>
    </Card>
  );
}
