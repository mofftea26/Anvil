import { router } from "expo-router";
import React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

import { useAppSelector } from "@/shared/hooks/useAppSelector";
import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Card, LoadingSpinner, StickyHeader, Text, useTheme, VStack } from "@/shared/ui";
import { Ionicons } from "@expo/vector-icons";
import { usePublishedWorkouts } from "../hooks/usePublishedWorkouts";

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export default function WorkoutsScreen() {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const auth = useAppSelector((s) => s.auth);
  const trainerId = auth.userId ?? "";

  const { rows, isLoading, error, refetch } = usePublishedWorkouts(trainerId);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StickyHeader
        title={t("library.workouts", "Workouts")}
        showBackButton

        rightButton={{
    icon: (
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={theme.colors.text}
            />
          ),  
          variant: "icon",
          onPress: () => router.push("/(trainer)/library/workout-builder/new"),
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
              <Button onPress={() => router.push("/(trainer)/library/workout-builder/new")}>
                {t("common.new")}
              </Button>
            </VStack>
          </Card>
        ) : (
          <VStack style={{ gap: theme.spacing.md }}>
            {rows.map((w) => (
              <Pressable
                key={w.id}
                onPress={() =>
                  router.push(`/(trainer)/library/workout-builder/${w.id}` as any)
                }
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <Card>
                  <VStack style={{ gap: 6 }}>
                    <Text weight="bold" numberOfLines={1}>
                      {w.title || t("builder.workoutDetails.defaultTitle")}
                    </Text>
                    <Text muted>
                      {t("library.workoutsList.updatedAt")} {formatShortDate(w.updatedAt)}
                    </Text>
                  </VStack>
                </Card>
              </Pressable>
            ))}
          </VStack>
        )}
      </ScrollView>
    </View>
  );
}
