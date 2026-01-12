import { Check, ChevronDown, ChevronUp } from "@tamagui/lucide-icons";
import React from "react";
import { Adapt, Label, Select, Sheet, Text, YStack } from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

export type SelectItem = {
  value: string;
  label: string;
  description?: string;
};

type AppSelectProps = {
  id?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  items: SelectItem[];
};

export function AppSelect({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  items,
}: AppSelectProps) {
  const [open, setOpen] = React.useState(false);

  const getItemLabel = React.useCallback(
    (val: string) => items.find((x) => x.value === val)?.label ?? "",
    [items]
  );

  const handleValueChange = React.useCallback(
    (next: string) => {
      onValueChange(next);
      // ✅ force close after selection (prevents “always open”)
      setOpen(false);
    },
    [onValueChange]
  );

  return (
    <YStack gap="$2">
      <Label htmlFor={id} fontSize={13} opacity={0.85}>
        {label}
      </Label>

      <Select
        id={id}
        value={value}
        open={open}
        onOpenChange={setOpen}
        onValueChange={handleValueChange}
        disablePreventBodyScroll
        renderValue={getItemLabel}
      >
        <Select.Trigger
          height={50}
          backgroundColor="$surface"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$6"
          paddingHorizontal="$3"
          iconAfter={ChevronDown}
        >
          <Select.Value
            placeholder={placeholder ?? "—"}
            color={value ? "$color" : "rgba(255,255,255,0.45)"}
          />
        </Select.Trigger>

        {/* ✅ Mobile sheet version (no native) */}
        <Adapt when={"maxMd" as any} platform="touch">
          <Sheet
            modal
            dismissOnSnapToBottom
            animation={"medium" as any}
            open={open}
            onOpenChange={setOpen}
          >
            <Sheet.Frame
              backgroundColor="$surface"
              borderTopLeftRadius="$8"
              borderTopRightRadius="$8"
            >
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>

            <Sheet.Overlay
              backgroundColor="$shadowColor"
              animation={"lazy" as any}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              opacity={0.35}
              onPress={() => setOpen(false)}
            />
          </Sheet>
        </Adapt>

        {/* ✅ Only render dropdown content when open */}
        {open ? (
          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton
              alignItems="center"
              justifyContent="center"
              position="relative"
              width="100%"
              height="$3"
            >
              <YStack zIndex={10}>
                <ChevronUp size={18} />
              </YStack>

              <LinearGradient
                start={[0, 0]}
                end={[0, 1]}
                fullscreen
                colors={["$background", "transparent"]}
                borderRadius="$4"
              />
            </Select.ScrollUpButton>

            <Select.Viewport minWidth={240}>
              <Select.Group>
                <Select.Label>{label}</Select.Label>

                {items.map((item, i) => (
                  <Select.Item key={item.value} index={i} value={item.value}>
                    <Select.ItemText>
                      <YStack>
                        <Text>{item.label}</Text>
                        {item.description ? (
                          <Text fontSize={12} opacity={0.7}>
                            {item.description}
                          </Text>
                        ) : null}
                      </YStack>
                    </Select.ItemText>

                    <Select.ItemIndicator marginLeft="auto">
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>

            <Select.ScrollDownButton
              alignItems="center"
              justifyContent="center"
              position="relative"
              width="100%"
              height="$3"
            >
              <YStack zIndex={10}>
                <ChevronDown size={18} />
              </YStack>

              <LinearGradient
                start={[0, 0]}
                end={[0, 1]}
                fullscreen
                colors={["transparent", "$background"]}
                borderRadius="$4"
              />
            </Select.ScrollDownButton>
          </Select.Content>
        ) : null}
      </Select>
    </YStack>
  );
}
