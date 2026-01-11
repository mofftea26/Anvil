import { Button, Text, YStack } from "tamagui";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function FullscreenState({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: Props) {
  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      justifyContent="center"
      alignItems="center"
      padding="$6"
      gap="$3"
    >
      <Text fontSize={18} fontWeight="700" textAlign="center">
        {title}
      </Text>

      {subtitle ? (
        <Text opacity={0.75} textAlign="center" lineHeight={22}>
          {subtitle}
        </Text>
      ) : null}

      {actionLabel && onActionPress ? (
        <Button
          marginTop="$2"
          backgroundColor="$accent"
          color="$background"
          onPress={onActionPress}
        >
          {actionLabel}
        </Button>
      ) : null}
    </YStack>
  );
}
