import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, HStack, useTheme } from "@/shared/ui";

import type { LinkTrainerTab } from "@/features/linking/hooks/link-trainer/useLinkTrainer";

type LinkTrainerTabSwitchProps = {
  tab: LinkTrainerTab;
  onSwitch: (next: LinkTrainerTab) => void;
};

export function LinkTrainerTabSwitch({ tab, onSwitch }: LinkTrainerTabSwitchProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  return (
    <HStack
      style={{
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.lg,
        padding: 6,
        gap: 6,
      }}
    >
      <Button
        variant="ghost"
        height={42}
        style={{
          flex: 1,
          borderRadius: theme.radii.md,
          backgroundColor: tab === "redeem" ? theme.colors.surface2 : "transparent",
          borderColor: "transparent",
        }}
        onPress={() => onSwitch("redeem")}
      >
        {t("linking.client.redeemTitle")}
      </Button>
      <Button
        variant="ghost"
        height={42}
        style={{
          flex: 1,
          borderRadius: theme.radii.md,
          backgroundColor: tab === "request" ? theme.colors.surface2 : "transparent",
          borderColor: "transparent",
        }}
        onPress={() => onSwitch("request")}
      >
        {t("linking.client.requestTitle")}
      </Button>
    </HStack>
  );
}
