import { useCallback, useMemo, useState } from "react";

import { router } from "expo-router";

import {
  useGetTrainerClientsQuery,
  useSetTrainerClientStatusMutation,
} from "@/features/linking/api/linkingApiSlice";
import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { appToast, useTheme } from "@/shared/ui";

type StatusPill = {
  label: string;
  bg: string;
  border: string;
  text: string;
};

type AvatarPresentation = {
  bg: string;
  imageUrl?: string;
  initials?: string | null;
};

type ClientCard = {
  id: string;
  clientId: string;
  name: string;
  statusPill: StatusPill;
  targetText: string;
  checkInText: string;
  avatar: AvatarPresentation;
  isArchived: boolean;
};

const formatCheckIn = (iso: string, t: (k: string) => string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / 86400000
  );

  if (diffDays === 0) return t("common.today");
  if (diffDays === 1) return t("common.tomorrow");
  if (diffDays === -1) return t("common.yesterday");

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
};

const getInitials = (
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | null => {
  const a = (firstName ?? "").trim();
  const b = (lastName ?? "").trim();
  const s = `${a} ${b}`.trim();
  if (!s) return null;
  const parts = s.split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const initials = (first + second).toUpperCase();
  return initials || null;
};

const hashStringToInt = (input: string): number => {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const pickAvatarBg = (seed: string): string => {
  const palette = [
    "#7C3AED",
    "#38BDF8",
    "#22C55E",
    "#F97316",
    "#F43F5E",
    "#A855F7",
    "#06B6D4",
  ];
  const idx = hashStringToInt(seed) % palette.length;
  return palette[idx];
};

export const useTrainerClients = () => {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);

  const trainerId = auth.userId ?? "";
  const { data, isLoading, error, refetch } = useGetTrainerClientsQuery(
    { trainerId },
    { skip: !trainerId }
  );
  const [setStatus, setStatusState] = useSetTrainerClientStatusMutation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleAddClient = useCallback(() => {
    router.push("/(trainer)/add-client");
  }, []);

  const handleViewClient = useCallback((clientId: string) => {
    router.push(`/(trainer)/client/${clientId}`);
  }, []);

  const handleToggleArchive = useCallback(
    async (clientId: string, isArchived: boolean) => {
      try {
        await setStatus({
          clientId,
          status: isArchived ? "active" : "archived",
        }).unwrap();
        await refetch();
      } catch (err: any) {
        appToast.error(err?.message ?? t("auth.errors.generic"));
      }
    },
    [refetch, setStatus, t]
  );

  const clientCards = useMemo<ClientCard[]>(() => {
    if (!data) return [];

    return data.map((row) => {
      const c = row.client;
      const name =
        c?.firstName || c?.lastName
          ? `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim()
          : c?.email ?? "—";

      const isArchived = row.status === "archived";

      const target = c?.profile?.target ?? null;
      const targetText = target ? String(target) : t("linking.clients.noTarget");

      const nextCheckIn = row.management?.nextCheckInAt ?? null;
      const checkInText = nextCheckIn ? formatCheckIn(nextCheckIn, t) : "—";

      const statusPill: StatusPill = isArchived
        ? {
            label: t("linking.clients.archive"),
            bg: "rgba(255,255,255,0.10)",
            border: "rgba(255,255,255,0.16)",
            text: theme.colors.text,
          }
        : {
            label: t(
              `linking.management.status.${
                row.management?.clientStatus ?? "active"
              }`
            ),
            bg: "rgba(255,255,255,0.10)",
            border: "rgba(255,255,255,0.16)",
            text: theme.colors.text,
          };

      const seed = c?.id || c?.email || row.clientId || row.id;
      const avatarUrl = c?.avatarUrl ?? "";
      const avatar: AvatarPresentation = {
        bg: avatarUrl ? "rgba(255,255,255,0.10)" : pickAvatarBg(seed),
        imageUrl: avatarUrl || undefined,
        initials: avatarUrl ? undefined : getInitials(c?.firstName, c?.lastName),
      };

      return {
        id: row.id,
        clientId: row.clientId,
        name,
        statusPill,
        targetText,
        checkInText,
        avatar,
        isArchived,
      };
    });
  }, [data, t, theme.colors.text]);

  const errorMessage = error
    ? (error as any)?.message ?? t("auth.errors.generic")
    : null;

  return {
    t,
    theme,
    clientCards,
    isLoading,
    errorMessage,
    refreshing,
    onRefresh,
    onAddClient: handleAddClient,
    onViewClient: handleViewClient,
    onToggleArchive: handleToggleArchive,
    isUpdatingStatus: setStatusState.isLoading,
  };
};
