import React from "react";
import { Button, ProgressBar, Text, useTheme, VStack } from "../ui";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  progress?: number; // 0..1
};

export function FullscreenState({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  progress,
}: Props) {
  const theme = useTheme();
  return (
    <VStack
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
      }}
    >
      <Text variant="title" weight="bold" style={{ textAlign: "center", fontSize: 18 }}>
        {title}
      </Text>

      {subtitle ? (
        <Text muted style={{ textAlign: "center" }}>
          {subtitle}
        </Text>
      ) : null}

      {typeof progress === "number" ? (
        <VStack style={{ width: "100%", maxWidth: 420, marginTop: theme.spacing.sm }}>
          <ProgressBar progress={progress} />
        </VStack>
      ) : null}

      {actionLabel && onActionPress ? (
        <Button onPress={onActionPress} style={{ marginTop: theme.spacing.sm }}>
          {actionLabel}
        </Button>
      ) : null}
    </VStack>
  );
}
