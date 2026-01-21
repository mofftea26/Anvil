import React, { useMemo } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import type { SetTypeRow } from "@/features/library/types/setTypes";
import { getSetTypeIconName } from "../utils/setTypeIcons";

import { Icon, Text, useTheme } from "@/shared/ui";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";

type Props = {
  visible: boolean;
  setTypes: SetTypeRow[];
  selectedId: string | null;
  onClose: () => void;
  onPick: (id: string | null) => void;
};

export function SetTypePickerSheet({
  visible,
  setTypes,
  selectedId,
  onClose,
  onPick,
}: Props) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const grouped = useMemo(() => {
    const map = new Map<string, SetTypeRow[]>();
    for (const st of setTypes) {
      const key = (st.key ?? "Other").trim() || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(st);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [setTypes]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t("builder.setTypePicker.title")}</Text>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: theme.colors.surface3 },
              ]}
            >
              <Icon name="close" size={18} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* None option */}
            <Pressable
              onPress={() => {
                onPick(null);
                onClose();
              }}
              style={[
                styles.row,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface3,
                },
              ]}
            >
              <View style={styles.iconWrap}>
                <Icon name="flash-outline" size={18} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "900" }}>
                  {t("builder.setTypePicker.noneTitle")}
                </Text>
                <Text style={{ opacity: 0.7, marginTop: 2 }}>
                  {t("builder.setTypePicker.noneSubtitle")}
                </Text>
              </View>

              {selectedId === null ? (
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.accent}
                />
              ) : null}
            </Pressable>

            {grouped.map(([cat, rows]) => (
              <View key={cat} style={{ marginTop: 14 }}>
                <Text style={styles.category}>{cat}</Text>

                <View style={{ gap: 10, paddingHorizontal: 14 }}>
                  {rows.map((st) => {
                    const icon = getSetTypeIconName(st.key);
                    const isSelected = st.id === selectedId;

                    return (
                      <Pressable
                        key={st.id}
                        onPress={() => {
                          onPick(st.id);
                          onClose();
                        }}
                        style={[
                          styles.row,
                          {
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.surface3,
                          },
                        ]}
                      >
                        <View style={styles.iconWrap}>
                          <Icon name={icon} size={18} color="white" />
                        </View>

                        <Text style={{ flex: 1, fontWeight: "900" }}>
                          {st.title}
                        </Text>

                        {isSelected ? (
                          <Icon
                            name="checkmark-circle"
                            size={20}
                            color={theme.colors.accent}
                          />
                        ) : (
                          <Icon
                            name="chevron-forward"
                            size={18}
                            color="rgba(255,255,255,0.55)"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            {!setTypes.length ? (
              <View style={{ padding: 14 }}>
                <Text style={{ opacity: 0.7 }}>
                  No set types found yet.
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    maxHeight: "86%",
    overflow: "hidden",
  },
  header: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  category: {
    paddingHorizontal: 14,
    fontWeight: "900",
    opacity: 0.8,
    marginBottom: 10,
  },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
});
