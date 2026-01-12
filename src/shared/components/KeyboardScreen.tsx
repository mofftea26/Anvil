import React, { PropsWithChildren } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

type KeyboardScreenProps = PropsWithChildren<{
  padding?: number;
  bottomSpace?: number;
  centerIfShort?: boolean;
}>;

export function KeyboardScreen({
  children,
  padding = 24,
  bottomSpace,
  centerIfShort = false,
}: KeyboardScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const backgroundColor = String(theme.background?.get() ?? "#000");

  const bottom = bottomSpace ?? Math.max(insets.bottom, 12) + 90;

  return (
    <View style={[styles.flex, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <Pressable
          style={[styles.flex, { backgroundColor }]}
          onPress={Keyboard.dismiss}
        >
          <ScrollView
            style={[styles.flex, { backgroundColor }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.container,
              centerIfShort ? styles.centeredContainer : null,
            ]}
          >
            <View
              style={[styles.flex, centerIfShort ? styles.centeredInner : null]}
            >
              {children}
            </View>
          </ScrollView>
        </Pressable>
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
