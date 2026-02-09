import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";

import {
  formatCheckIn,
  getInitials,
  pickAvatarBg,
} from "@/features/clients/utils/clientUi";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  HStack,
  Icon,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";
import { formatSlugToLabel } from "@/shared/utils/formatSlugToLabel";
import { AssignToClientActions } from "@/features/clients/components/assignments/AssignToClientActions";

export type TrainerClientRow = {
  id: string;
  clientId: string;
  status: string;
  client?: {
    id?: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    profile?: { target?: string | null } | null;
  } | null;
  management?: {
    clientStatus?: string;
    nextCheckInAt?: string | null;
  } | null;
};

type TrainerClientCardProps = {
  row: TrainerClientRow;
  onPressView: (clientId: string) => void;
  onPressArchive: (
    clientId: string,
    isArchived: boolean
  ) => void | Promise<void>;
  archiveLoading: boolean;
  onAssigned?: () => void;
  assignmentSummary?: {
    activeProgram: { id: string; programtemplateid: string; startdate: string } | null;
    todayWorkout: { id: string; workoutTemplateId: string; scheduledFor: string } | null;
    programTitle?: string | null;
    workoutTitle?: string | null;
  };
};

export function TrainerClientCard({
  row,
  onPressView,
  onPressArchive,
  archiveLoading,
  onAssigned,
  assignmentSummary,
}: TrainerClientCardProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();

  const c = row.client;
  const name =
    c?.firstName || c?.lastName
      ? `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim()
      : c?.email ?? "—";

  const isArchived = row.status === "archived";

  const target = c?.profile?.target ?? null;
  const targetText =
    target && target.trim()
      ? formatSlugToLabel(target)
      : t("linking.clients.noTarget");

  const nextCheckIn = row.management?.nextCheckInAt ?? null;
  const checkInText = nextCheckIn ? formatCheckIn(nextCheckIn, t) : "—";
  const hasActiveProgram = Boolean(assignmentSummary?.activeProgram);
  const todayWorkoutId = assignmentSummary?.todayWorkout?.workoutTemplateId ?? null;
  const programTitle =
    assignmentSummary?.programTitle ??
    assignmentSummary?.activeProgram?.programtemplateid ??
    null;
  const workoutTitle = assignmentSummary?.workoutTitle ?? null;

  const statusPill = isArchived
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

  const avatarUrl = c?.avatarUrl ?? "";
  const hasImage = Boolean(avatarUrl);
  const initials = getInitials(c?.firstName, c?.lastName);
  const seed = c?.id || c?.email || row.clientId || row.id;
  const bg = pickAvatarBg(seed);

  return (
    <Card padded={false} style={{ overflow: "hidden" }}>
      <View style={{ position: "relative" }}>
        <LinearGradient
          colors={[
            "rgba(124,58,237,0.22)",
            "rgba(56,189,248,0.10)",
            "rgba(255,255,255,0.00)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          }}
        />

        <VStack style={{ gap: 12, padding: 14 }}>
          <HStack align="center" justify="space-between">
            <HStack align="center" gap={10} style={{ flex: 1 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  backgroundColor: hasImage ? "rgba(255,255,255,0.10)" : bg,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                {hasImage ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    cachePolicy="none"
                    transition={1000}
                  />
                ) : initials ? (
                  <Text weight="bold" style={{ color: "white", fontSize: 14 }}>
                    {initials}
                  </Text>
                ) : (
                  <Icon name="person" size={20} color="white" />
                )}
              </View>
              <VStack style={{ flex: 1 }}>
                <Text weight="bold" numberOfLines={1} style={{ fontSize: 16 }}>
                  {name}
                </Text>
              </VStack>
            </HStack>

            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: statusPill.bg,
                borderWidth: 1,
                borderColor: statusPill.border,
              }}
            >
              <Text variant="caption" style={{ color: statusPill.text }}>
                {statusPill.label}
              </Text>
            </View>
          </HStack>

          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <HStack align="center" style={{ gap: 12 }}>
              <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text variant="caption" muted>
                  {t("profile.fields.target")}
                </Text>
                <Text numberOfLines={1} weight="semibold">
                  {targetText}
                </Text>
              </VStack>

              <View
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  backgroundColor: "rgba(255,255,255,0.10)",
                }}
              />

              <VStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text variant="caption" muted>
                  {t("linking.clients.nextCheckIn")}
                </Text>
                <Text numberOfLines={1} weight="semibold">
                  {checkInText}
                </Text>
              </VStack>
            </HStack>
          </View>

          <HStack gap={10}>
            <Button
              variant="secondary"
              height={40}
              fullWidth
              style={{ flex: 1 }}
              onPress={() => onPressView(row.clientId)}
            >
              {t("linking.clients.viewClient")}
            </Button>
            {!hasActiveProgram ? (
              <View style={{ flex: 1 }}>
                <AssignToClientActions
                  clientId={row.clientId}
                  variant="compact"
                  onAssigned={onAssigned}
                />
              </View>
            ) : null}
            <Button
              height={40}
              fullWidth
              style={{ flex: 1 }}
              isLoading={archiveLoading}
              onPress={() => void onPressArchive(row.clientId, isArchived)}
            >
              {isArchived
                ? t("linking.clients.unarchive")
                : t("linking.clients.archive")}
            </Button>
          </HStack>

          {hasActiveProgram ? (
            <View
              style={{
                marginTop: 12,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 12,
              }}
            >
              <VStack style={{ gap: 8 }}>
                <HStack align="center" justify="space-between">
                  <Text variant="caption" muted>
                    {t("clients.assigned", "Assigned")}
                  </Text>
                  <Text variant="caption" muted>
                    {t("clients.assignLocked", "Locked")}
                  </Text>
                </HStack>
                <HStack align="center" justify="space-between">
                  <Text numberOfLines={1} weight="semibold" style={{ flex: 1 }}>
                    {t("clients.program", "Program")} • {programTitle}
                  </Text>
                </HStack>
                <HStack align="center" justify="space-between">
                  <Text variant="caption" muted>
                    {t("clients.todaysWorkout", "Today")}
                  </Text>
                  <Text numberOfLines={1} weight="semibold">
                    {todayWorkoutId
                      ? workoutTitle ?? t("clients.workout", "Workout")
                      : t("clients.rest", "Rest")}
                  </Text>
                </HStack>
              </VStack>
            </View>
          ) : null}
        </VStack>
      </View>
    </Card>
  );
}
