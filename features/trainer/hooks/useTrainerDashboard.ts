import { useCallback, useState } from "react";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useTheme } from "@/shared/ui";

export const useTrainerDashboard = () => {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { t, theme, refreshing, onRefresh };
};
