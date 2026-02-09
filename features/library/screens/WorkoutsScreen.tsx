import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { WorkoutCard } from "@/features/library/components/workouts/WorkoutCard";
import { useWorkouts } from "@/features/library/hooks/workouts/useWorkouts";
import { AssignToClientsSheet } from "@/features/clients/components/assignments/AssignToClientsSheet";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import {
  Button,
  Card,
  Icon,
  LoadingSpinner,
  StickyHeader,
  Text,
  useTheme,
  VStack,
} from "@/shared/ui";

export default function WorkoutsScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignItem, setAssignItem] = React.useState<{ id: string; title: string } | null>(null);
  const {
    rows,
    isLoading,
    error,
    refreshing,
    onRefresh,
    onAddWorkout,
    onOpenWorkout,
  } = useWorkouts();

  const openAssign = React.useCallback((id: string, title: string) => {
    setAssignItem({ id, title });
    setAssignOpen(true);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("library.workouts", "Workouts")}
        showBackButton
        rightButton={{
          icon: (
            <Icon name="add-circle-outline" size={22} color={theme.colors.text} strokeWidth={1.5} />
          ),
          variant: "icon",
          onPress: onAddWorkout,
        }}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={theme.colors.text}
          />
        }
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text color={theme.colors.danger}>{error}</Text> : null}

        {isLoading ? (
          <LoadingSpinner />
        ) : !rows.length ? (
          <Card>
            <VStack style={{ gap: theme.spacing.sm }}>
              <Text weight="bold">{t("library.workoutsList.empty")}</Text>
              <Button onPress={onAddWorkout}>{t("common.new")}</Button>
            </VStack>
          </Card>
        ) : (
          <VStack style={{ gap: theme.spacing.md }}>
            {rows.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                updatedAtLabel={t("library.workoutsList.updatedAt")}
                defaultTitle={t("builder.workoutDetails.defaultTitle")}
                onPress={() => onOpenWorkout(w.id)}
                onPressAssign={() => {
                  openAssign(w.id, w.title || t("builder.workoutDetails.defaultTitle"));
                }}
              />
            ))}
          </VStack>
        )}
      </ScrollView>

      {assignItem ? (
        <AssignToClientsSheet
          visible={assignOpen}
          onClose={() => setAssignOpen(false)}
          mode="workout"
          item={assignItem}
        />
      ) : null}
    </View>
  );
}
