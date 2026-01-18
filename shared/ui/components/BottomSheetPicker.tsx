import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { useTheme } from "../theme";
import { Button } from "./Button";
import { Card } from "./Card";
import { Divider } from "./Divider";
import { Text } from "./Text";

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
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
    <View style={{ gap: 8 }}>
      {label ? (
        <Text variant="caption" style={{ opacity: 0.9 }}>
          {label}
        </Text>
      ) : null}

      <Pressable
        testID={triggerTestID}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          color={selectedLabel ? theme.colors.text : "rgba(255,255,255,0.45)"}
        >
          {triggerText}
        </Text>
        <Text muted style={{ opacity: 0.9 }}>
          ⌵
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.overlay} onPress={close} />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <View style={styles.header}>
              <Text weight="bold">{title ?? label ?? ""}</Text>
              <Button
                variant="icon"
                onPress={close}
                height={40}
                left={
                  <Ionicons
                    name="close-sharp"
                    size={24}
                    color={theme.colors.accent}
                  />
                }
              ></Button>
            </View>

            {searchable ? (
              <Card
                padded={false}
                background="surface2"
                style={styles.searchWrap}
              >
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder ?? t("common.search")}
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={[
                    styles.searchInput,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamilyRegular,
                    },
                  ]}
                />
              </Card>
            ) : null}

            <Divider opacity={0.7} />

            {loading ? (
              <View style={{ padding: 18, alignItems: "center" }}>
                <Text muted>{t("common.loading")}</Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(x) => x.value}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingVertical: 10 }}
                renderItem={({ item }) => {
                  const selected = isSelected(item.value);
                  return (
                    <Pressable
                      onPress={() => {
                        if (isMulti(props)) {
                          if (props.requireConfirm) {
                            toggleMulti(item.value);
                            return;
                          }
                          const next = props.value.includes(item.value)
                            ? props.value.filter((x) => x !== item.value)
                            : [...props.value, item.value];
                          props.onChange(next);
                          return;
                        }
                        pickSingle(item.value);
                      }}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          borderColor: selected
                            ? theme.colors.accent
                            : theme.colors.border,
                          backgroundColor: selected
                            ? theme.colors.surface2
                            : "transparent",
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text weight="semibold">{item.label}</Text>
                        {showDescriptions && item.description ? (
                          <Text variant="caption" muted>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                      {selected ? (
                        <Text color={theme.colors.accent} weight="bold">
                          ✓
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ padding: 18, alignItems: "center" }}>
                    <Text muted>{t("common.noResults")}</Text>
                  </View>
                }
              />
            )}

            {isMulti(props) && props.requireConfirm ? (
              <View style={{ gap: 10 }}>
                <Divider opacity={0.7} />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Button
                    variant="secondary"
                    fullWidth
                    style={{ flex: 1 }}
                    onPress={clearMulti}
                  >
                    {props.clearLabel ?? t("common.clear")}
                  </Button>
                  <Button fullWidth style={{ flex: 1 }} onPress={applyMulti}>
                    {props.confirmLabel ?? t("common.apply")}
                  </Button>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 12,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  searchWrap: {
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
  },
  searchInput: {
    paddingVertical: 0,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
});
