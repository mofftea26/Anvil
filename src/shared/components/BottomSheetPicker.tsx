import { Check, Search, X } from "@tamagui/lucide-icons";
import React from "react";
import {
  Button,
  Input,
  Label,
  Separator,
  Sheet,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";

export type BottomSheetOption = {
  value: string;
  label: string;
  description?: string;
};

type BaseProps = {
  label?: string;
  placeholder?: string;
  options: BottomSheetOption[];

  searchable?: boolean;
  searchPlaceholder?: string;

  title?: string;
  showDescriptions?: boolean;

  loading?: boolean;
  disabled?: boolean;
  triggerTestID?: string;
};

type SingleProps = BaseProps & {
  mode?: "single";
  value: string | null;
  onChange: (value: string | null) => void;
};

type MultiProps = BaseProps & {
  mode: "multi";
  value: string[];
  onChange: (value: string[]) => void;

  requireConfirm?: boolean;
  confirmLabel?: string;
  clearLabel?: string;
};

export type BottomSheetPickerProps = SingleProps | MultiProps;

function isMulti(props: BottomSheetPickerProps): props is MultiProps {
  return props.mode === "multi";
}

export function BottomSheetPicker(props: BottomSheetPickerProps) {
  const {
    label,
    placeholder,
    options,
    searchable,
    searchPlaceholder,
    title,
    showDescriptions,
    loading,
    disabled,
    triggerTestID,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [draft, setDraft] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    if (isMulti(props)) setDraft(props.value);
  }, [open, props]);

  const filtered = React.useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const selectedLabel = React.useMemo(() => {
    if (isMulti(props)) {
      if (!props.value.length) return "";
      const labels = props.value
        .map((v) => options.find((o) => o.value === v)?.label)
        .filter(Boolean) as string[];
      return labels.join(", ");
    }
    if (!props.value) return "";
    return options.find((o) => o.value === props.value)?.label ?? "";
  }, [props, options]);

  const triggerText = selectedLabel || placeholder || "—";

  const close = () => setOpen(false);

  const isSelected = (val: string) => {
    if (isMulti(props)) {
      return (props.requireConfirm ? draft : props.value).includes(val);
    }
    return props.value === val;
  };

  const toggleMulti = (val: string) => {
    setDraft((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  };

  const applyMulti = () => {
    if (!isMulti(props)) return;
    props.onChange(draft);
    close();
  };

  const clearMulti = () => {
    if (!isMulti(props)) return;
    setDraft([]);
    if (!props.requireConfirm) {
      props.onChange([]);
      close();
    }
  };

  const pickSingle = (val: string) => {
    if (isMulti(props)) return;
    props.onChange(val);
    close();
  };

  return (
    <YStack gap="$2">
      {label ? (
        <Label fontSize={13} opacity={0.85}>
          {label}
        </Label>
      ) : null}

      <Button
        testID={triggerTestID}
        disabled={disabled}
        onPress={() => setOpen(true)}
        height={50}
        justifyContent="space-between"
        backgroundColor="$surface"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$6"
        paddingHorizontal="$3"
        pressStyle={{ opacity: 0.9 }}
      >
        <Text
          numberOfLines={1}
          color={selectedLabel ? "$color" : "rgba(255,255,255,0.45)"}
        >
          {triggerText}
        </Text>
        <Text opacity={0.6}>⌵</Text>
      </Button>

      <Sheet
        modal
        open={open}
        onOpenChange={setOpen}
        dismissOnSnapToBottom
        snapPoints={[85]}
        snapPointsMode="percent"
        animation={"medium" as any}
      >
        <Sheet.Overlay
          opacity={0.4}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          animation={"lazy" as any}
          onPress={close}
        />

        <Sheet.Frame
          backgroundColor="$surface"
          borderTopLeftRadius="$10"
          borderTopRightRadius="$10"
          padding="$4"
          gap="$3"
        >
          {/* Header */}
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize={16} fontWeight="700">
              {title ?? label ?? ""}
            </Text>

            <Button
              size="$3"
              circular
              backgroundColor="$surface2"
              borderColor="$borderColor"
              borderWidth={1}
              onPress={close}
              icon={X}
            />
          </XStack>

          {searchable ? (
            <XStack
              alignItems="center"
              gap="$2"
              backgroundColor="$surface2"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius="$6"
              paddingHorizontal="$3"
              height={48}
            >
              <Search size={18} opacity={0.8} />
              <Input
                flex={1}
                unstyled
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder ?? "Search…"}
                placeholderTextColor="rgba(255,255,255,0.45)"
              />
              {query ? (
                <Button
                  size="$2"
                  circular
                  backgroundColor="transparent"
                  onPress={() => setQuery("")}
                  icon={X}
                />
              ) : null}
            </XStack>
          ) : null}

          <Separator opacity={0.5} />

          {/* Content */}
          <Sheet.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <YStack padding="$4" alignItems="center" justifyContent="center">
                <Spinner size="large" color="$accent" />
              </YStack>
            ) : filtered.length ? (
              <YStack gap="$2">
                {filtered.map((opt) => {
                  const selected = isSelected(opt.value);

                  return (
                    <XStack
                      key={opt.value}
                      alignItems="center"
                      justifyContent="space-between"
                      paddingVertical="$3"
                      paddingHorizontal="$3"
                      borderRadius="$8"
                      borderWidth={1}
                      borderColor={selected ? "$accent" : "$borderColor"}
                      backgroundColor={selected ? "$surface2" : "transparent"}
                      pressStyle={{ opacity: 0.85 }}
                      onPress={() => {
                        if (isMulti(props)) {
                          if (props.requireConfirm) {
                            toggleMulti(opt.value);
                            return;
                          }
                          const next = props.value.includes(opt.value)
                            ? props.value.filter((x) => x !== opt.value)
                            : [...props.value, opt.value];
                          props.onChange(next);
                          return;
                        }
                        pickSingle(opt.value);
                      }}
                    >
                      <YStack flex={1} gap="$1">
                        <Text fontSize={15} fontWeight="600">
                          {opt.label}
                        </Text>
                        {showDescriptions && opt.description ? (
                          <Text fontSize={12} opacity={0.75}>
                            {opt.description}
                          </Text>
                        ) : null}
                      </YStack>

                      {selected ? <Check size={18} color="$accent" /> : null}
                    </XStack>
                  );
                })}
              </YStack>
            ) : (
              <YStack padding="$4" alignItems="center" justifyContent="center">
                <Text opacity={0.7}>No results</Text>
              </YStack>
            )}
          </Sheet.ScrollView>

          {/* Footer for multi confirm */}
          {isMulti(props) && props.requireConfirm ? (
            <>
              <Separator opacity={0.5} />
              <XStack gap="$2">
                <Button
                  flex={1}
                  backgroundColor="$surface2"
                  borderColor="$borderColor"
                  borderWidth={1}
                  onPress={clearMulti}
                >
                  {props.clearLabel ?? "Clear"}
                </Button>

                <Button
                  flex={1}
                  backgroundColor="$accent"
                  color="$background"
                  onPress={applyMulti}
                >
                  {props.confirmLabel ?? "Apply"}
                </Button>
              </XStack>
            </>
          ) : null}
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
