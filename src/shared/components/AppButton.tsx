import React from "react";
import { Button, Spinner, XStack } from "tamagui";

type AppButtonProps = {
  children: React.ReactNode;
  isLoading?: boolean;
} & React.ComponentProps<typeof Button>;

export function AppButton({
  children,
  isLoading,
  disabled,
  ...props
}: AppButtonProps) {
  const isDisabled = Boolean(disabled || isLoading);

  return (
    <Button disabled={isDisabled} {...props}>
      {isLoading ? (
        <XStack alignItems="center" gap="$2">
          <Spinner size="small" />
        </XStack>
      ) : (
        children
      )}
    </Button>
  );
}
