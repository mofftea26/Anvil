import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ProgramTemplate } from "@/features/library/types/programTemplate";
import { listProgramTemplates } from "@/features/library/api/programTemplates.api";
import { ProgramTemplateCard } from "@/features/library/components/programs/programsPage/components/ProgramTemplateCard";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text, useTheme } from "@/shared/ui";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectProgramTemplate: (programId: string, title: string) => void;
};

export function ChooseProgramTemplateSheet({
  visible,
  onClose,
  onSelectProgramTemplate,
}: Props) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listProgramTemplates({ includeArchived: false });
      setRows(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load programs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    fetchList();
  }, [visible, fetchList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => (p.title ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  const lastEditedLabel = t("library.programsScreen.lastEdited", "Last edited");

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.backdrop, { paddingTop: insets.top }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
              paddingBottom: insets.bottom + 24,
              maxHeight: "80%",
            },
          ]}
        >
          <View style={[styles.handleWrap]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.textMuted }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text weight="bold" style={[styles.headerTitle, { color: theme.colors.text }]}>
              Choose program
            </Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Icon name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface3, borderColor: theme.colors.border }]}>
            <Icon name="search" size={18} color={theme.colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search programs..."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Icon name="close" size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={{ color: theme.colors.danger }}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <ProgramTemplateCard
                  template={item}
                  lastEditedLabel={lastEditedLabel}
                  isArchived={item.isArchived}
                  onPress={() => {
                    onSelectProgramTemplate(item.id, item.title || "Untitled program");
                    onClose();
                  }}
                  onDuplicate={() => {}}
                  onArchive={() => {}}
                  onUnarchive={() => {}}
                  onDelete={() => {}}
                  showActions={false}
                  assignmentStats={null}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ color: theme.colors.textMuted }}>No programs found.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
  },
  handleWrap: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18 },
  closeBtn: { padding: 8 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  listContent: { padding: 16, paddingBottom: 24, gap: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  empty: { padding: 24, alignItems: "center" },
});

