import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TrainerClientRow } from "@/features/clients/components/trainer-clients/TrainerClientCard";
import { useTrainerClientsAssignmentsSummary } from "@/features/clients/hooks/assignments/useTrainerClientsAssignmentsSummary";
import { useTrainerClients } from "@/features/clients/hooks/trainer-clients/useTrainerClients";
import { useTrainerTodayCheckInsCount } from "@/features/checkins/hooks/useTrainerTodayCheckInsCount";
import { TrainerRosterAvatarChip } from "@/features/dashboard/components/TrainerRosterAvatarChip";
import {
  buildTrainerTodaysRosterRows,
  type TrainerTodaysRosterRow,
} from "@/features/dashboard/utils/buildTrainerTodaysRosterRows";
import {
  getInitials,
  hexToRgba,
} from "@/features/linking/utils/coachFormatting";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  HStack,
  Icon,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  getScreenHorizontalPadding,
  useTheme,
  VStack,
} from "@/shared/ui";

type TrainerRoster = ReturnType<typeof useTrainerClientsAssignmentsSummary>;

function formatTodayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function StatChip(props: {
  icon: string;
  label: string;
  value: string | number;
  tone: "accent" | "accent2" | "danger";
}) {
  const theme = useTheme();
  const color =
    props.tone === "accent"
      ? theme.colors.accent
      : props.tone === "accent2"
        ? theme.colors.accent2
        : theme.colors.danger;
  return (
    <View
      style={{
        flex: 1,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: hexToRgba(color, 0.22),
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          backgroundColor: hexToRgba(color, 0.16),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={props.icon} size={16} color={color} strokeWidth={2} />
      </View>
      <Text weight="bold" style={{ fontSize: 22, lineHeight: 26 }}>
        {String(props.value)}
      </Text>
      <Text variant="caption" muted numberOfLines={1}>
        {props.label}
      </Text>
    </View>
  );
}

function NoProgramCard(props: { count: number; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const color = theme.colors.danger;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("trainer.dashboard.noProgramCardTitle", "Clients without a program")}
      onPress={props.onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 108,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: hexToRgba(color, 0.35),
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.88 : 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
      })}
    >
      <HStack align="center" justify="space-between">
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.radii.md,
            backgroundColor: hexToRgba(color, 0.2),
            borderWidth: 1,
            borderColor: hexToRgba(color, 0.28),
          }}
        >
          <Text weight="bold" style={{ fontSize: 14, color }}>
            {String(props.count)}
          </Text>
        </View>
        <Icon name="warning" size={20} color={color} strokeWidth={2} />
      </HStack>
      <Text weight="bold" numberOfLines={2} style={{ fontSize: 13, lineHeight: 17 }}>
        {t("trainer.dashboard.noProgramCardTitle", "Need a program")}
      </Text>
      <Text variant="caption" muted numberOfLines={2} style={{ fontSize: 11 }}>
        {t("trainer.dashboard.noProgramCardHint", "Review clients without an active program")}
      </Text>
    </Pressable>
  );
}

function CheckInsCard(props: { count: number; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const color = theme.colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("trainer.dashboard.checkInsCardTitle", "Check-ins today")}
      onPress={props.onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 108,
        borderRadius: theme.radii.lg,
        borderWidth: 1,
        borderColor: hexToRgba(color, 0.32),
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.88 : 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
      })}
    >
      <HStack align="center" justify="space-between">
        <Text weight="bold" style={{ fontSize: 22, lineHeight: 26, color }}>
          {String(props.count)}
        </Text>
        <Icon name="chevron-forward" size={18} color={color} strokeWidth={2} />
      </HStack>
      <Text weight="bold" numberOfLines={2} style={{ fontSize: 13, lineHeight: 17 }}>
        {t("trainer.dashboard.checkInsCardTitle", "Check-ins today")}
      </Text>
      <Text variant="caption" muted numberOfLines={2} style={{ fontSize: 11 }}>
        {t("trainer.dashboard.checkInsCardHint", "Open your check-in timeline")}
      </Text>
    </Pressable>
  );
}

function HeroCard(props: {
  trainerName: string;
  avatarUrl: string | null;
  activeCount: number;
  todayCount: number;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const initials = getInitials(props.trainerName.split(" ")[0] ?? "", props.trainerName.split(" ")[1] ?? "");

  return (
    <Card
      padded={false}
      bordered
      style={{
        overflow: "hidden",
        borderColor: hexToRgba(theme.colors.accent, 0.22),
        backgroundColor: theme.colors.surface2,
      }}
    >
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={[
            hexToRgba(theme.colors.accent, 0.55),
            hexToRgba(theme.colors.accent2, 0.32),
            "rgba(255,255,255,0.00)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
        />
        <HStack align="center" gap={12} style={{ padding: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              overflow: "hidden",
              backgroundColor: theme.colors.surface3,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: hexToRgba(theme.colors.accent, 0.35),
            }}
          >
            {props.avatarUrl ? (
              <Image
                source={{ uri: props.avatarUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={300}
              />
            ) : initials ? (
              <Text weight="bold" style={{ color: theme.colors.text, fontSize: 16 }}>
                {initials}
              </Text>
            ) : (
              <Icon name="person" size={20} color={theme.colors.text} />
            )}
          </View>
          <VStack style={{ flex: 1, minWidth: 0 }}>
            <Text variant="caption" muted style={{ fontSize: 11, letterSpacing: 0.4 }}>
              {formatTodayLabel().toUpperCase()}
            </Text>
            <Text weight="bold" numberOfLines={1} style={{ fontSize: 18, lineHeight: 22 }}>
              {t("trainer.dashboard.greeting", "Hey, {{name}}", {
                name: props.trainerName || t("trainer.dashboard.coachFallback", "Coach"),
              })}
            </Text>
            <Text variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>
              {t(
                "trainer.dashboard.heroSummary",
                "{{active}} active clients · {{today}} training today",
                {
                  active: String(props.activeCount),
                  today: String(props.todayCount),
                }
              )}
            </Text>
          </VStack>
        </HStack>
      </View>
    </Card>
  );
}

function TodayRosterCard(props: {
  rosterRows: TrainerTodaysRosterRow[];
  todayCount: number;
  totalActive: number;
  noProgramCount: number;
  onViewAll: () => void;
  onPressClient: (clientId: string) => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const previewRows = props.rosterRows.slice(0, 3);
  const hasFocus = props.noProgramCount > 0;
  const moreCount = Math.max(0, props.rosterRows.length - previewRows.length);

  return (
    <Card
      bordered
      background="surface2"
      style={{
        gap: 10,
        padding: 14,
      }}
    >
      <HStack align="center" justify="space-between">
        <HStack align="center" gap={8}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              backgroundColor: hexToRgba(theme.colors.accent, 0.18),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="calendar-03" size={16} color={theme.colors.accent} strokeWidth={2} />
          </View>
          <VStack>
            <Text weight="bold" style={{ fontSize: 14, lineHeight: 18 }}>
              {t("trainer.dashboard.todayTitle")}
            </Text>
            <Text variant="caption" muted style={{ fontSize: 11 }}>
              {t("trainer.dashboard.todaySubtitle", "{{n}} clients training", {
                n: String(props.todayCount),
              })}
            </Text>
          </VStack>
        </HStack>
        <Pressable
          onPress={props.onViewAll}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
          accessibilityHint={t("trainer.dashboard.viewAllRosterHint", "Opens full roster for today")}
        >
          <HStack align="center" gap={4}>
            <Text variant="caption" weight="semibold" style={{ color: theme.colors.accent }}>
              {t("trainer.dashboard.viewAll")}
            </Text>
            <Icon name="chevron-forward" size={14} color={theme.colors.accent} />
          </HStack>
        </Pressable>
      </HStack>

      {previewRows.length === 0 ? (
        <View
          style={{
            minHeight: 100,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: hexToRgba(theme.colors.textMuted, 0.12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="people-outline" size={20} color={theme.colors.textMuted} />
          </View>
          <Text muted variant="caption" style={{ textAlign: "center", fontSize: 12 }}>
            {hasFocus
              ? t("trainer.dashboard.focusNoProgram", "{{n}} clients need a program", {
                  n: String(props.noProgramCount),
                })
              : props.totalActive === 0
                ? t("trainer.dashboard.emptyNoClients")
                : t("trainer.dashboard.allRest")}
          </Text>
        </View>
      ) : (
        <VStack gap={8}>
          <HStack align="flex-start" justify="space-between" gap={6}>
            {previewRows.map((row) => (
              <View key={row.clientId} style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
                <TrainerRosterAvatarChip
                  name={row.name}
                  avatarUrl={row.avatarUrl}
                  seed={row.seed}
                  initials={row.initials}
                  avatarSize={48}
                  columnWidth={100}
                  onPress={() => props.onPressClient(row.clientId)}
                />
              </View>
            ))}
          </HStack>
          {moreCount > 0 ? (
            <Text variant="caption" muted style={{ textAlign: "center", fontSize: 11 }}>
              {t("trainer.dashboard.moreClients", "+{{n}} more", {
                n: String(moreCount),
              })}
            </Text>
          ) : null}
        </VStack>
      )}
    </Card>
  );
}

export default function TrainerDashboardScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const screenPadding = getScreenHorizontalPadding(theme);

  const profile = useMyProfile();
  const trainerFirst = profile.me?.firstName?.trim() ?? "";
  const trainerLast = profile.me?.lastName?.trim() ?? "";
  const trainerName = `${trainerFirst} ${trainerLast}`.trim();

  const [summaryRefreshToken, setSummaryRefreshToken] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const { data, onRefresh, trainerId } = useTrainerClients();

  const rows = (data as TrainerClientRow[] | undefined) ?? [];
  const activeRows = React.useMemo(
    () => rows.filter((row) => row.status !== "archived"),
    [rows]
  );
  const activeClientIds = React.useMemo(
    () => activeRows.map((row) => row.clientId),
    [activeRows]
  );

  const summary: TrainerRoster = useTrainerClientsAssignmentsSummary({
    trainerId,
    clientIds: activeClientIds,
    refreshToken: summaryRefreshToken,
  });

  const noProgramCount = React.useMemo(
    () =>
      activeRows.filter(
        (row) => !summary.activeProgramsByClientId[row.clientId]
      ).length,
    [activeRows, summary.activeProgramsByClientId]
  );

  const todayCount = React.useMemo(
    () =>
      activeRows.filter((row) =>
        Boolean(summary.todayWorkoutByClientId[row.clientId])
      ).length,
    [activeRows, summary.todayWorkoutByClientId]
  );

  const { count: todayCheckInsCount } = useTrainerTodayCheckInsCount(summaryRefreshToken);

  const rosterRows = React.useMemo(
    () =>
      buildTrainerTodaysRosterRows({
        activeRows,
        todayWorkoutByClientId: summary.todayWorkoutByClientId,
        workoutTitleById: summary.workoutTitleById,
        todayYmd: summary.todayYmd,
        unnamedClientLabel: t("trainer.dashboard.unnamedClient"),
      }),
    [
      activeRows,
      summary.todayWorkoutByClientId,
      summary.workoutTitleById,
      summary.todayYmd,
      t,
    ]
  );

  const handleRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([onRefresh(), profile.refetch()]);
      setSummaryRefreshToken((x) => x + 1);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, profile]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabBackgroundGradient />
      <StickyHeader
        title={t("trainer.dashboardTitle")}
        subtitle={t("trainer.dashboardSubtitle")}
        rightButton={{
          onPress: () => void handleRefresh(),
          variant: "icon",
          isLoading: refreshing,
          icon: <Icon name="refresh" size={20} color={theme.colors.text} />,
        }}
      />
      <VStack
        style={{
          flex: 1,
          gap: 10,
          paddingHorizontal: screenPadding,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        }}
      >
        <HeroCard
          trainerName={trainerName}
          avatarUrl={profile.me?.avatarUrl ?? null}
          activeCount={activeRows.length}
          todayCount={todayCount}
        />

        <TodayRosterCard
          rosterRows={rosterRows}
          todayCount={todayCount}
          totalActive={activeRows.length}
          noProgramCount={noProgramCount}
          onViewAll={() =>
            router.push("/(trainer)/todays-roster" as Parameters<typeof router.push>[0])
          }
          onPressClient={(clientId) =>
            router.push(`/(trainer)/client/${clientId}` as Parameters<typeof router.push>[0])
          }
        />

        <HStack gap={10}>
          <StatChip
            icon="people-outline"
            label={t("trainer.dashboard.activeClients")}
            value={activeRows.length}
            tone="accent"
          />
          <StatChip
            icon="calendar-03"
            label={t("trainer.dashboard.checkInsToday", "Check-ins today")}
            value={todayCheckInsCount}
            tone="accent2"
          />
        </HStack>

        <HStack gap={10} align="stretch">
          <NoProgramCard
            count={noProgramCount}
            onPress={() =>
              router.push("/(trainer)/clients-without-program" as Parameters<typeof router.push>[0])
            }
          />
          <CheckInsCard
            count={todayCheckInsCount}
            onPress={() =>
              router.push("/(trainer)/check-ins" as Parameters<typeof router.push>[0])
            }
          />
        </HStack>

        <Button
          variant="secondary"
          fullWidth
          onPress={() =>
            router.push("/(trainer)/add-client" as Parameters<typeof router.push>[0])
          }
          left={<Icon name="add-circle-outline" size={20} color={theme.colors.text} />}
        >
          {t("trainer.dashboard.addClient")}
        </Button>
      </VStack>
    </View>
  );
}
