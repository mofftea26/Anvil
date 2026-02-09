import { useMemo } from "react";

import { useGetTrainerClientsQuery } from "@/features/linking/api/linkingApiSlice";
import { useAppSelector } from "@/shared/hooks/useAppSelector";

export function useTrainerClientsOptions() {
  const trainerId = useAppSelector((s) => s.auth.userId ?? "");
  const q = useGetTrainerClientsQuery({ trainerId }, { skip: !trainerId });

  const options = useMemo(() => {
    const rows = q.data ?? [];
    return rows.map((row) => {
      const c = (row as any).client ?? null;
      const name =
        c?.firstName || c?.lastName
          ? `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim()
          : c?.email ?? row.clientId ?? "Client";
      return { value: row.clientId as string, label: name };
    });
  }, [q.data]);

  return { trainerId, options, isLoading: q.isLoading, refetch: q.refetch };
}

