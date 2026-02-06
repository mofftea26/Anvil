import React from "react";
import { StyleSheet, View } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Icon, Text } from "@/shared/ui";

const AnimatedView = createAnimatedComponent(View);

export function DayPlannerSwipeHint(props: {
  palette: { emptyIconBg: string; emptyIcon: string; emptyHint: string };
  arrowStyle: any;
}) {
  const { t } = useAppTranslation();
  const { palette } = props;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: palette.emptyIconBg,
          marginBottom: 12,
        },
      ]}
    >
      <AnimatedView style={props.arrowStyle}>
        <Icon
          name="chevron-back"
          size={18}
          color={palette.emptyIcon}
          strokeWidth={2}
        />
      </AnimatedView>
      <Text style={[styles.text, { color: palette.emptyHint }]}>
        {t("library.programsScreen.swipeLeftToRemove", "Swipe left to remove")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});
