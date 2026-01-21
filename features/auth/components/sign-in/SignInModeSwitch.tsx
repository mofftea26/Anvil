import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Text, useTheme, HStack } from "@/shared/ui";
import { Pressable } from "react-native";

import type { SignInMode } from "@/features/auth/hooks/sign-in/useSignInForm";

type SignInModeSwitchProps = {
  mode: SignInMode;
  onSwitch: (next: SignInMode) => void;
};

export function SignInModeSwitch({ mode, onSwitch }: SignInModeSwitchProps) {
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
      <Pressable
        onPress={() => onSwitch("password")}
        style={{
          flex: 1,
          height: 44,
          borderRadius: theme.radii.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: mode === "password" ? theme.colors.surface2 : "transparent",
        }}
      >
        <Text weight="semibold">{t("auth.signIn")}</Text>
      </Pressable>

      <Pressable
        onPress={() => onSwitch("magic")}
        style={{
          flex: 1,
          height: 44,
          borderRadius: theme.radii.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: mode === "magic" ? theme.colors.surface2 : "transparent",
        }}
      >
        <Text weight="semibold">{t("auth.magicLink")}</Text>
      </Pressable>
    </HStack>
  );
}
