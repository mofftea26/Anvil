import React, { PropsWithChildren } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";

type KeyboardScreenProps = PropsWithChildren<{
  padding?: number;
  bottomSpace?: number;
  centerIfShort?: boolean;
}>;

export function KeyboardScreen({
  children,
  padding = 16,
  bottomSpace,
  centerIfShort = false,
}: KeyboardScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const bottom = bottomSpace ?? Math.max(insets.bottom, 10) + 56;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={[styles.flex, { backgroundColor: theme.colors.background }]}
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
            { padding, paddingBottom: bottom },
            centerIfShort ? styles.centeredContainer : null,
          ]}
        >
          <View style={[styles.flex, centerIfShort ? styles.centeredInner : null]}>
            {children}
          </View>
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

