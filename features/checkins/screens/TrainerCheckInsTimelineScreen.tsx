import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  appToast,
  getScreenHorizontalPadding,
  Icon,
  StickyHeader,
  TabBackgroundGradient,
  Text,
  TimelineBoard,
  useTheme,
  VStack,
} from "@/shared/ui";
import { DEFAULT_SCHEDULE_TIME } from "@/shared/utils/scheduleTime";

import { CheckInModal } from "../components/CheckInModal";
import { CheckInTimelineItem } from "../components/CheckInTimelineItem";
import { useTrainerCheckIns } from "../hooks/useTrainerCheckIns";
import type { CheckInStatus, TrainerCheckIn } from "../types";

function statusColor(status: CheckInStatus, colors: ReturnType<typeof useTheme>["colors"]): string {
  switch (status) {
    case "completed":
      return colors.accent;
    case "missed":
      return colors.danger;
    case "cancelled":
      return colors.textMuted;
    default:
      return colors.accent2;
  }
}

function CheckInsSkeleton() {
  const theme = useTheme();
  return (
    <VStack style={{ gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 84,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surface2,
            opacity: 0.6,
          }}
        />
      ))}
    </VStack>
  );
}

export default function TrainerCheckInsTimelineScreen() {
  const theme = useTheme();
  const { t } = useAppTranslation();
  const insets = useSafeAreaInsets();
  const screenPadding = getScreenHorizontalPadding(theme);

  const checkIns = useTrainerCheckIns();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<TrainerCheckIn | null>(null);

  useEffect(() => {
    if (checkIns.error) appToast.error(checkIns.error);
  }, [checkIns.error]);

  const checkInById = useMemo(
    () => new Map(checkIns.rows.map((r) => [r.id, r] as const)),
    [checkIns.rows]
  );

  const timelineItems = useMemo(
    () =>
      checkIns.rows.map((row) => {
        const name =
          [row.clientFirstName, row.clientLastName].filter(Boolean).join(" ").trim() ||
          t("trainer.checkIns.unnamedClient", "Client");
        const sub = row.notes
          ? row.notes.length > 56
            ? `${row.notes.slice(0, 53)}…`
            : row.notes
          : null;
        return {
          id: row.id,
          dateKey: row.scheduledFor,
          title: name,
          subtitle: sub,
          scheduledTime: row.scheduledTime ?? DEFAULT_SCHEDULE_TIME,
          sourceColor: theme.colors.accent,
          statusLabel: t(`trainer.checkIns.status.${row.status}`, row.status),
          statusColor: statusColor(row.status, theme.colors),
        };
      }),
    [checkIns.rows, t, theme.colors]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <TabBackgroundGradient />
      <StickyHeader
        showBackButton
        title={t("trainer.checkIns.title", "Check-ins")}
        subtitle={t("trainer.checkIns.subtitle", "Schedule and review client check-ins")}
        rightButton={{
          onPress: () => void checkIns.onRefresh(),
          variant: "icon",
          isLoading: checkIns.refreshing,
          icon: <Icon name="refresh" size={20} color={theme.colors.text} />,
        }}
      />
      <View
        style={{
          flex: 1,
          paddingHorizontal: screenPadding,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 12) + 56,
      }}
      >
        {checkIns.isLoading ? (
          <CheckInsSkeleton />
        ) : (
          <VStack style={{ gap: 6, flex: 1 }}>
            <TimelineBoard
              title={t("trainer.checkIns.timelineTitle", "Timeline")}
              monthLabel={checkIns.monthLabel}
              monthIndex={checkIns.monthIndex}
              year={checkIns.year}
              days={checkIns.days}
              items={timelineItems}
              canDrag
              onPrevMonth={() => checkIns.goPrevMonth()}
              onNextMonth={() => checkIns.goNextMonth()}
              onChangeMonthYear={checkIns.setMonthYear}
              onSelectDay={(dateKey) => checkIns.setSelectedDateKey(dateKey)}
              onPressItem={(id) => {
                const row = checkInById.get(id);
                if (!row) return;
                setModalMode("edit");
                setEditing(row);
                setModalOpen(true);
              }}
              onDropTime={async (id, newTime) => {
                try {
                  await checkIns.reorderAfterTimeChange(id, newTime);
                } catch (e: unknown) {
                  appToast.error(e instanceof Error ? e.message : t("common.tryAgain", "Try again"));
                }
              }}
              renderItemContent={(item, extras) => {
                const row = checkInById.get(item.id);
                if (!row) return null;
                return <CheckInTimelineItem item={item} row={row} liveTimeLabel={extras.liveTimeLabel} />;
              }}
              bottomHintText={t(
                "trainer.checkIns.dragHint",
                "Drag check-ins on the timeline to reschedule. Tap a card to edit details."
              )}
            />
          </VStack>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("trainer.checkIns.addFab", "Add check-in")}
        onPress={() => {
          setModalMode("create");
          setEditing(null);
          setModalOpen(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.accent,
            bottom: Math.max(insets.bottom, 16) + 8,
            right: screenPadding,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Icon name="add" size={26} color="#fff" />
      </Pressable>

      <CheckInModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        initial={editing}
        defaultDateYmd={checkIns.selectedDateKey}
        onSave={async (input) => {
          await checkIns.saveCheckIn(input);
        }}
        onDelete={modalMode === "edit" ? (id) => checkIns.removeCheckIn(id) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
