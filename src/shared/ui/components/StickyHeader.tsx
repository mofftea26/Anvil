import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HStack } from "../layout/Stack";
import { useTheme } from "../theme";
import { Button } from "./Button";
import { Text } from "./Text";

export function useStickyHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + 36 + 12; // safe area + button height + padding
}

type StickyHeaderButton = {
  label?: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
  icon?: React.ReactNode;
};

type StickyHeaderProps = {
  title: string;
  leftButton?: StickyHeaderButton;
  rightButton?: StickyHeaderButton;
  showBackButton?: boolean;
  backgroundColor?: string;
  scrolled?: boolean;
};

export function StickyHeader({
  title,
  leftButton,
  rightButton,
  showBackButton = false,
}: StickyHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const effectiveLeftButton: StickyHeaderButton | undefined = showBackButton
    ? {
        label: "",
        onPress: () => router.back(),
        variant: "ghost" as const,
        isLoading: false,
        icon: (
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        ),
      }
    : leftButton;

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          paddingBottom: 12,
          backgroundColor: "transparent",
        },
      ]}
    >
      <HStack
        style={{
          justifyContent: "space-between",
          width: "100%",
          paddingLeft: 24,
          paddingRight: 12,
        }}
      >
        <View style={{ alignItems: "flex-start" }}>
          {effectiveLeftButton && (
            <Button
              variant={effectiveLeftButton.variant ?? "secondary"}
              height={36}
              isLoading={effectiveLeftButton.isLoading}
              onPress={effectiveLeftButton.onPress}
              left={effectiveLeftButton.icon}
            >
              {title}
            </Button>
          )}
        </View>
        {!showBackButton && (
          <Text
            variant="body"
            weight="semibold"
            numberOfLines={1}
            style={{
              flex: 1,
              textAlign: "left",
              fontSize: 18,
            }}
          >
            {title}
          </Text>
        )}
        {rightButton && (
          <Button
            variant={rightButton.variant ?? "secondary"}
            height={32}
            isLoading={rightButton.isLoading}
            onPress={rightButton.onPress}
            left={rightButton.icon}
          >
            {rightButton.label}
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
