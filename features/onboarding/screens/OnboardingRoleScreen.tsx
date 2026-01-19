import { router } from "expo-router";
import { Pressable } from "react-native";

import { useUpdateMyUserRowMutation } from "@/features/profile/api/profileApiSlice";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, KeyboardScreen, Text, useTheme, VStack } from "@/shared/ui";

export default function OnboardingRole() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);
  const [updateMyUserRow] = useUpdateMyUserRowMutation();

  const setRole = async (role: "trainer" | "client") => {
    if (!auth.userId) return;

    await updateMyUserRow({
      userId: auth.userId,
      payload: { role, roleConfirmed: true },
    }).unwrap();

    router.replace("/"); // role gate
  };

  return (
    <KeyboardScreen centerIfShort padding={theme.spacing.xl}>
      <VStack style={{ gap: theme.spacing.xl }}>
        <VStack style={{ gap: theme.spacing.sm }}>
          <Text weight="bold" style={{ fontSize: 28, lineHeight: 32 }}>
            {t("onboarding.roleTitle")}
          </Text>
          <Text muted>{t("onboarding.roleSubtitle")}</Text>
        </VStack>

        <Pressable onPress={() => void setRole("trainer")}>
          <Card>
            <VStack style={{ gap: theme.spacing.sm }}>
              <Text weight="bold" style={{ fontSize: 18 }}>
                {t("onboarding.trainer")}
              </Text>
              <Text muted style={{ lineHeight: 20 }}>
                {t("onboarding.roleHintTrainer")}
              </Text>
              <Button
                style={{ marginTop: theme.spacing.sm }}
                height={44}
                onPress={() => void setRole("trainer")}
              >
                {t("onboarding.trainer")}
              </Button>
            </VStack>
          </Card>
        </Pressable>

        <Pressable onPress={() => void setRole("client")}>
          <Card>
            <VStack style={{ gap: theme.spacing.sm }}>
              <Text weight="bold" style={{ fontSize: 18 }}>
                {t("onboarding.client")}
              </Text>
              <Text muted style={{ lineHeight: 20 }}>
                {t("onboarding.roleHintClient")}
              </Text>
              <Button
                variant="secondary"
                style={{ marginTop: theme.spacing.sm }}
                height={44}
                onPress={() => void setRole("client")}
              >
                {t("onboarding.client")}
              </Button>
            </VStack>
          </Card>
        </Pressable>
      </VStack>
    </KeyboardScreen>
  );
}
