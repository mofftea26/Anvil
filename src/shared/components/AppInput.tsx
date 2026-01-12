import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import type { TextInputProps } from "react-native";
import { Button, Input, Text, XStack, YStack, useTheme } from "tamagui";
import { useAppTranslation } from "../i18n/useAppTranslation";

type AppInputProps = {
  label: string;
  error?: string;
  type?: "text" | "password";
} & Omit<TextInputProps, "onChange"> & {
    value?: string;
    onChangeText?: (text: string) => void;
  };

export function AppInput({
  label,
  error,
  type = "text",
  value,
  onChangeText,
  placeholder,
  ...props
}: AppInputProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const isPassword = type === "password";

  const [visible, setVisible] = useState(false);

  const secureTextEntry = useMemo(() => {
    if (!isPassword) return false;
    return !visible;
  }, [isPassword, visible]);

  const iconColor = String(theme.color?.get() ?? "#000");
  const placeholderTextColor = "rgba(255,255,255,0.45)";

  return (
    <YStack gap="$2">
      <Text fontSize={13} opacity={0.85}>
        {label}
      </Text>

      <XStack
        alignItems="center"
        backgroundColor="$surface"
        borderColor={error ? "$accent2" : "$borderColor"}
        borderWidth={1}
        borderRadius="$6"
        height={50}
        paddingHorizontal="$3"
      >
        <Input
          flex={1}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCorrect={false}
          backgroundColor="transparent"
          borderWidth={0}
          paddingRight={isPassword ? "$2" : "$0"}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          color="$color"
          {...props}
        />

        {isPassword ? (
          <Button
            unstyled
            width={44}
            height={44}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.6 }}
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              visible ? t("common.hidePassword") : t("common.showPassword")
            }
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={iconColor}
            />
          </Button>
        ) : null}
      </XStack>

      {error ? (
        <Text fontSize={12} color="$accent2">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}
