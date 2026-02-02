import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  archiveProgramTemplate,
  deleteProgramTemplate,
  duplicateProgramTemplate,
  listProgramTemplates,
  type ProgramTemplate,
  type ProgramDifficulty,
} from "@/features/library/api/programTemplates.api";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast } from "@/shared/ui";

export type ProgramListFilter = "all" | "archived" | ProgramDifficulty;

export function useProgramTemplatesList() {
  const { t } = useAppTranslation();
  const [rows, setRows] = useState<ProgramTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ProgramListFilter>("all");

  const fetchList = useCallback(async () => {
    setError(null);
    try {
      const includeArchived = filter === "archived";
      const difficulty =
        filter !== "all" && filter !== "archived" ? filter : undefined;
      const list = await listProgramTemplates({
        includeArchived,
        difficulty,
      });
      setRows(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load programs";
      setError(msg);
      setRows([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setIsLoading(true);
    fetchList();
  }, [fetchList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchList();
  }, [fetchList]);

  const onNewProgram = useCallback(() => {
    router.push("/(trainer)/library/create-program" as Parameters<typeof router.push>[0]);
  }, []);

  const onOpenProgram = useCallback((id: string) => {
    router.push(
      `/(trainer)/library/program-templates/${id}` as Parameters<typeof router.push>[0]
    );
  }, []);

  const onDuplicate = useCallback(
    async (id: string) => {
      try {
        const created = await duplicateProgramTemplate(id);
        if (filter !== "archived") {
          setRows((prev) => [created, ...prev]);
        }
        appToast.success(t("library.programsScreen.menuDuplicate") + " – done");
        onOpenProgram(created.id);
      } catch (e: unknown) {
        appToast.error(e instanceof Error ? e.message : "Duplicate failed");
      }
    },
    [t, filter, onOpenProgram]
  );

  const onArchive = useCallback(
    async (id: string) => {
      try {
        await archiveProgramTemplate(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        appToast.success("Archived");
      } catch (e: unknown) {
        appToast.error(e instanceof Error ? e.message : "Archive failed");
      }
    },
    []
  );

  const onDelete = useCallback(
    async (id: string) => {
      try {
        await deleteProgramTemplate(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        appToast.success("Deleted");
      } catch (e: unknown) {
        appToast.error(e instanceof Error ? e.message : "Delete failed");
      }
    },
    []
  );

  return {
    rows,
    isLoading,
    error,
    refreshing,
    filter,
    setFilter,
    onRefresh,
    onNewProgram,
    onOpenProgram,
    onDuplicate,
    onArchive,
    onDelete,
    refetch: fetchList,
  };
}
