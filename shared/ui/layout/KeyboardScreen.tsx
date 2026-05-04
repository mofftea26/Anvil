import React, { PropsWithChildren } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme";
import type { AppTheme } from "../theme";

type KeyboardScreenProps = PropsWithChildren<{
  padding?: number;
  bottomSpace?: number;
  centerIfShort?: boolean;
  style?: StyleProp<ViewStyle>;
  scrollStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  headerHeight?: number;
}>;

export function getScreenHorizontalPadding(theme: AppTheme): number {
  return theme.spacing.sm;
}

export function KeyboardScreen({
  children,
  padding,
  bottomSpace,
  centerIfShort = false,
  style,
  scrollStyle,
  contentContainerStyle,
  refreshControl,
}: KeyboardScreenProps) {
  const theme = useTheme();

  // Default bottom padding is 12 for all pages
  const bottom = bottomSpace !== undefined ? bottomSpace : 12;
  const horizontalPadding = padding !== undefined ? padding : getScreenHorizontalPadding(theme);

  return (
    <View
      style={[styles.flex, { backgroundColor: theme.colors.background }, style]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          refreshControl={refreshControl}
          style={[
            styles.flex,
            { backgroundColor: theme.colors.background },
            scrollStyle,
          ]}
          alwaysBounceVertical
          bounces
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "on-drag" : "none"}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Keyboard.dismiss}
          // Dismiss keyboard when tapping "empty space" without stealing scroll.
          onStartShouldSetResponderCapture={() => {
            Keyboard.dismiss();
            return false;
          }}
          contentContainerStyle={[
            styles.container,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: theme.spacing.xs,
              paddingBottom: bottom,
            },
            contentContainerStyle,
            centerIfShort ? styles.centeredContainer : null,
          ]}
        >
          {centerIfShort ? (
            <View style={[styles.flex, styles.centeredInner]}>{children}</View>
          ) : (
            children
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1 },
  centeredContainer: { justifyContent: "center" },
  centeredInner: { justifyContent: "center" },
});
