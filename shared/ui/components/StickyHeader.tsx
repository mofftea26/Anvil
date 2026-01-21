import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HStack } from "../layout/Stack";
import { useTheme } from "../theme";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Text } from "./Text";

export function useStickyHeaderHeight(options?: { subtitle?: boolean }): number {
  const insets = useSafeAreaInsets();
  // safe area + row height + padding (+ optional subtitle line)
  return insets.top + (options?.subtitle ? 16 : 0);
}

type StickyHeaderButton = {
  label?: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "icon";
  isLoading?: boolean;
  icon?: React.ReactNode;
};

type StickyHeaderProps = {
  title: string;
  subtitle?: string;
  leftButton?: StickyHeaderButton;
  rightButton?: StickyHeaderButton;
  showBackButton?: boolean;
  backgroundColor?: string;
  scrolled?: boolean;
};

export function StickyHeader({
  title,
  subtitle,
  leftButton,
  rightButton,
  showBackButton = false,
  backgroundColor,
}: StickyHeaderProps) {
  const theme = useTheme();

  const effectiveLeftButton: StickyHeaderButton | undefined = showBackButton
    ? {
        label: "",
        onPress: () => router.back(),
        variant: "ghost" as const,
        isLoading: false,
        icon: (
          <Icon name="chevron-back" size={22} color={theme.colors.text} />
        ),
      }
    : leftButton;

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: 10,
          paddingBottom: 12,
          backgroundColor:"transparent",
        },
      ]}
    >
      <HStack
        style={{
          justifyContent: "space-between",
          width: "100%",
          paddingLeft: 12,
          paddingRight: 12,
          alignItems: "center",
        }}
      >
        <View style={{ alignItems: "flex-start" }}>
          {effectiveLeftButton ? (
            <Button
              variant={effectiveLeftButton.variant ?? "secondary"}
              height={36}
              isLoading={effectiveLeftButton.isLoading}
              onPress={effectiveLeftButton.onPress}
              left={effectiveLeftButton.icon}
            >
              {effectiveLeftButton.label ?? ""}
            </Button>
          ) : null}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 0 }}>
          <Text
            variant="body"
            weight="semibold"
            numberOfLines={1}
            style={{
              textAlign: "left",
              fontSize: 18,
              lineHeight: 22,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              variant="caption"
              muted
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightButton && (
          <Button
            variant={rightButton.variant ?? "secondary"}
            height={32}
            isLoading={rightButton.isLoading}
            onPress={rightButton.onPress}
            left={rightButton.icon}
          >
            {rightButton.label ?? ""}
          </Button>
        )}
      </HStack>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
  },
});
