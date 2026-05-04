import { View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Chip, HStack, Icon, Text, useTheme, VStack } from "@/shared/ui";

type ClientCoachCertsCardProps = { certs: string[] };

export function ClientCoachCertsCard({ certs }: ClientCoachCertsCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <Card bordered background="surface2">
      <VStack style={{ gap: 10 }}>
        <HStack align="center" justify="space-between">
          <Text weight="bold">{t("profile.fields.certifications")}</Text>
          <Icon name="award" size={16} color={theme.colors.textMuted} />
        </HStack>
        {certs.length ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {certs.map((c) => (
              <Chip key={c} label={c} isActive={false} />
            ))}
          </View>
        ) : (
          <Text muted>{t("profile.certifications.empty")}</Text>
        )}
      </VStack>
    </Card>
  );
}
