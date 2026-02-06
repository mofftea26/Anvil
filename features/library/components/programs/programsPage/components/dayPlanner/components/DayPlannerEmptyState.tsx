import React from "react";
import { StyleSheet, View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text } from "@/shared/ui";

export function DayPlannerEmptyState(props: {
  palette: {
    emptyIconBg: string;
    emptyIcon: string;
    emptyText: string;
    emptyHint: string;
  };
}) {
  const { t } = useAppTranslation();
  const { palette } = props;

  return (
    <View style={styles.empty}>
      <View
        style={[styles.emptyIconRing, { backgroundColor: palette.emptyIconBg }]}
      >
        <Icon
          name="barbell-outline"
          size={48}
          color={palette.emptyIcon}
          style={styles.emptyIcon}
        />
      </View>
      <Text style={[styles.emptyText, { color: palette.emptyText }]}>
        {t("library.programsScreen.noWorkoutsThisDay", "No workouts this day")}
      </Text>
      <Text style={[styles.emptyHint, { color: palette.emptyHint }]}>
        {t(
          "library.programsScreen.tapAddToAddWorkout",
          "Tap + above to add a workout"
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    minHeight: 260,
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: { marginBottom: 0 },
  emptyText: {
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
  },
});
