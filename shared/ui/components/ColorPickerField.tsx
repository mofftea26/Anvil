import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { useTheme } from "../theme";
import { Button } from "./Button";
import { Card } from "./Card";
import { Divider } from "./Divider";
import { HStack } from "../layout/Stack";
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
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const palette = React.useMemo(
    () =>
      Array.from(
        new Set(
          (presets ?? [
            // Brand-first
            theme.colors.accent,
            theme.colors.accent2,

            // Neutrals (dark UI friendly)
            "#FFFFFF",
            "#0B0D10",
            "#0F172A",
            "#111827",
            "#1F2937",
            "#334155",
            "#64748B",
            "#94A3B8",

            // Trending modern accents (Tailwind-ish)
            "#6366F1", // indigo
            "#4F46E5",
            "#8B5CF6", // violet
            "#7C3AED",
            "#A855F7", // purple
            "#D946EF", // fuchsia
            "#EC4899", // pink
            "#F43F5E", // rose
            "#EF4444", // red
            "#F97316", // orange
            "#FB923C",
            "#F59E0B", // amber
            "#FDE047", // yellow
            "#A3E635", // lime
            "#22C55E", // green
            "#10B981", // emerald
            "#14B8A6", // teal
            "#06B6D4", // cyan
            "#22D3EE",
            "#38BDF8", // sky
            "#3B82F6", // blue
            "#2563EB",

            // “Appy” neon pops
            "#00D1FF",
            "#00FFA3",
            "#7AFF00",
            "#FF3D00",
            "#FF2D55",
            "#FFB000",
          ])
            .map((c) => String(c ?? "").trim().toUpperCase())
            .filter(Boolean)
        )
      ),
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
              <HStack gap={10}>
                <Button
                  variant="secondary"
                  height={40}
                  onPress={() => {
                    setDraft(value);
                    setOpen(false);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  height={40}
                  disabled={!isHexColor(draft)}
                  onPress={() => {
                    if (!isHexColor(draft)) return;
                    onChange(draft.trim());
                    setOpen(false);
                  }}
                >
                  {t("common.apply")}
                </Button>
              </HStack>
            </HStack>

            <Divider opacity={0.7} />

            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 12, paddingBottom: 6 }}
              showsVerticalScrollIndicator={false}
            >
              <Text variant="caption" muted>
                {t("common.enterHex")}
              </Text>

              <Card
                padded={false}
                background="surface2"
                style={{ paddingHorizontal: 14, height: 48, justifyContent: "center" }}
              >
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  autoCapitalize="none"
                  placeholder="#A3FF12"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  onFocus={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.typography.fontFamilyRegular,
                  }}
                />
              </Card>

              <Divider opacity={0.7} />

              <Text variant="caption" muted>
                {t("common.palette")}
              </Text>

              <View style={styles.grid}>
                {palette.map((c, idx) => (
                  <Pressable
                    key={`${c}-${idx}`}
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
            </ScrollView>
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

