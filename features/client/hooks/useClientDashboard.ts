import { useCallback, useState } from "react";

import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { useTheme } from "@/shared/ui";

export const useClientDashboard = () => {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const { refetch } = useMyProfile();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { t, theme, refreshing, onRefresh };
};
