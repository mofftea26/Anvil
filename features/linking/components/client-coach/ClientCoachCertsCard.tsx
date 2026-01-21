import { View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Card, Chip, Text, VStack } from "@/shared/ui";

type ClientCoachCertsCardProps = { certs: string[] };

export function ClientCoachCertsCard({ certs }: ClientCoachCertsCardProps) {
  const { t } = useAppTranslation();

  return (
    <Card>
      <VStack style={{ gap: 10 }}>
        <Text weight="bold">{t("profile.fields.certifications")}</Text>
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
