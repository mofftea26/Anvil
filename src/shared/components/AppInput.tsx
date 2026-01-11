import { Input, Text, YStack } from "tamagui";

type Props = {
  label: string;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
};

export function AppInput({ label, error, ...rest }: Props) {
  return (
    <YStack gap="$2">
      <Text fontSize={13} opacity={0.85}>
        {label}
      </Text>
      <Input
        backgroundColor="$surface"
        borderColor="$borderColor"
        borderWidth={1}
        height={48}
        borderRadius="$6"
        paddingHorizontal="$4"
        {...rest}
      />
      {error ? (
        <Text fontSize={12} color="$accent2">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}
