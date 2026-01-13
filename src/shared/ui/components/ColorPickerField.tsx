import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { useTheme } from "../theme";
import { Button } from "./Button";
import { Card } from "./Card";
import { Divider } from "./Divider";
import { HStack, VStack } from "../layout/Stack";
import { Text } from "./Text";

function isHexColor(v: string) {
  const s = v.trim();
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

type Props = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
};

export function ColorPickerField({ label, value, onChange, presets }: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const palette = React.useMemo(
    () =>
      presets ?? [
        theme.colors.accent,
        theme.colors.accent2,
        "#FFFFFF",
        "#0B0D10",
        "#11151B",
        "#161C24",
        "#FF4D4D",
        "#22C55E",
        "#3B82F6",
        "#F59E0B",
        "#A855F7",
        "#EC4899",
      ],
    [presets, theme.colors]
  );

  const current = value?.trim() || "";

  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption" style={{ opacity: 0.9 }}>
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <HStack align="center" justify="space-between" style={{ width: "100%" }}>
          <HStack align="center" gap={10}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: isHexColor(current) ? current : theme.colors.surface2,
              }}
            />
            <Text muted>{current || t("common.selectPlaceholder")}</Text>
          </HStack>
          <Text muted>⌵</Text>
        </HStack>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <HStack align="center" justify="space-between">
              <Text weight="bold">{label}</Text>
              <Button variant="secondary" height={40} onPress={() => setOpen(false)}>
                {t("common.close")}
              </Button>
            </HStack>

            <Divider opacity={0.7} />

            <VStack style={{ gap: 10 }}>
              <Text variant="caption" muted>
                {t("common.pickColor")}
              </Text>

              <View style={styles.grid}>
                {palette.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.swatch,
                      {
                        backgroundColor: c,
                        borderColor: theme.colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  />
                ))}
              </View>

              <Text variant="caption" muted style={{ marginTop: 6 }}>
                {t("common.orEnterHex")}
              </Text>

              <Card padded={false} background="surface2" style={{ paddingHorizontal: 14, height: 48, justifyContent: "center" }}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  autoCapitalize="none"
                  placeholder="#A3FF12"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamilyRegular,
                  }}
                />
              </Card>

              <HStack gap={10}>
                <Button
                  variant="secondary"
                  fullWidth
                  style={{ flex: 1 }}
                  onPress={() => {
                    setDraft(value);
                    setOpen(false);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  fullWidth
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (!isHexColor(draft)) return;
                    onChange(draft.trim());
                    setOpen(false);
                  }}
                >
                  {t("common.apply")}
                </Button>
              </HStack>
            </VStack>
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
    justifyContent: "center",
  },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 12,
    maxHeight: "85%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
  },
});

