import { Link } from "expo-router";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Text, useTheme, VStack } from "@/shared/ui";

export function CheckEmailView() {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <VStack style={{ gap: theme.spacing.md }}>
      <Text weight="bold" style={{ fontSize: 26, lineHeight: 30 }}>
        {t("auth.checkEmailTitle")}
      </Text>
      <Text muted>{t("auth.checkEmailSubtitle")}</Text>

      <Link href="/(auth)/sign-in" asChild>
        <Button variant="secondary" style={{ marginTop: theme.spacing.lg }}>
          {t("auth.goToSignIn")}
        </Button>
      </Link>
    </VStack>
  );
}
