import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, HStack, useTheme } from "@/shared/ui";

import type { TrainerAddClientTab } from "@/features/linking/hooks/trainer-add-client/useTrainerAddClient";

type TrainerAddClientTabSwitchProps = {
  value: TrainerAddClientTab;
  onChange: (v: TrainerAddClientTab) => void;
};

export function TrainerAddClientTabSwitch({
  value,
  onChange,
}: TrainerAddClientTabSwitchProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const items: { key: TrainerAddClientTab; label: string }[] = [
    { key: "invite", label: t("linking.addClient.inviteCode") },
    { key: "requests", label: t("linking.addClient.requests") },
    { key: "create", label: t("linking.addClient.createByEmail") },
  ];

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
      {items.map((it) => (
        <Button
          key={it.key}
          variant="ghost"
          height={42}
          style={{
            flex: 1,
            borderRadius: theme.radii.md,
            backgroundColor:
              value === it.key ? theme.colors.surface2 : "transparent",
            borderColor: "transparent",
          }}
          onPress={() => onChange(it.key)}
        >
          {it.label}
        </Button>
      ))}
    </HStack>
  );
}
