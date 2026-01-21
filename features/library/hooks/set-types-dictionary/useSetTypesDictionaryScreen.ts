import { useMemo, useState } from "react";

import type { SetTypesCategory } from "@/features/library/hooks/useSetTypesDictionary";
import { useSetTypesDictionary } from "@/features/library/hooks/useSetTypesDictionary";

export function useSetTypesDictionaryScreen() {
  const { rows, categories, isLoading, error } = useSetTypesDictionary();

  const tabs: SetTypesCategory[] = useMemo(
    () => (categories?.length ? categories : []),
    [categories]
  );

  const [activeTabKey, setActiveTabKey] = useState<string>(() => tabs[0]?.key ?? "tab-0");

  const activeTab = useMemo(
    () => tabs.find((x) => x.key === activeTabKey) ?? tabs[0],
    [tabs, activeTabKey]
  );

  return {
    tabs,
    activeTabKey,
    setActiveTabKey,
    activeTab,
    isLoading,
    error,
    rows,
  };
}
