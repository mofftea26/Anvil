import React, { PropsWithChildren } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";

type KeyboardScreenProps = PropsWithChildren<{
  padding?: number;
  bottomSpace?: number;
  centerIfShort?: boolean;
  style?: StyleProp<ViewStyle>;
  scrollStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement;
}>;

export function KeyboardScreen({
  children,
  padding = 16,
  bottomSpace,
  centerIfShort = false,
  style,
  scrollStyle,
  contentContainerStyle,
  refreshControl,
}: KeyboardScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Tabs already reserve space for the tab bar, so avoid adding a large extra
  // bottom padding (it causes a noticeable "dead space" at the end of scroll).
  const bottom = bottomSpace ?? Math.max(insets.bottom, 10) + 12;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }, style]}>
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

