import React, { PropsWithChildren, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ToastManager from "toastify-react-native";

import { Icon } from "../components/Icon";
import { useTheme } from "../theme";

type ToastType = "success" | "error" | "info" | "warn" | "default";

type ToastCardProps = {
  text1?: string;
  text2?: string;
  type?: ToastType;
  hide?: () => void;
  showCloseIcon?: boolean;
  width?: number | string;
  minHeight?: number | string;
  style?: StyleProp<ViewStyle>;
};

function ToastCard(props: ToastCardProps) {
  const {
    text1,
    text2,
    type = "default",
    hide,
    showCloseIcon = true,
    width,
    minHeight,
    style: styleProp,
  } = props;

  const theme = useTheme();

  const accentColor =
    type === "success"
      ? theme.colors.accent
      : type === "error"
        ? theme.colors.danger
        : theme.colors.accent2;

  const iconName =
    type === "success"
      ? "checkmark-circle"
      : type === "error"
        ? "close-circle"
        : type === "info"
          ? "information-circle"
          : "warning";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface2,
          borderLeftColor: accentColor,
          borderRadius: theme.radii.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          width: (width ?? "100%") as ViewStyle["width"],
          minHeight: (minHeight ?? 56) as ViewStyle["minHeight"],
        },
        styleProp as StyleProp<ViewStyle>,
      ]}
    >
      <Icon
        name={iconName}
        size={22}
        color={accentColor}
        strokeWidth={1.5}
      />
      <View style={styles.textWrap}>
        {text1 ? (
          <Text
            numberOfLines={2}
            style={[
              styles.text1,
              {
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamilySemiBold,
                fontSize: theme.typography.fontSizeBody,
              },
            ]}
          >
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text
            numberOfLines={1}
            style={[
              styles.text2,
              {
                color: theme.colors.textMuted,
                fontFamily: theme.typography.fontFamilyRegular,
                fontSize: theme.typography.fontSizeCaption,
              },
            ]}
          >
            {text2}
          </Text>
        ) : null}
      </View>
      {showCloseIcon && hide ? (
        <TouchableOpacity
          onPress={hide}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.close}
          activeOpacity={0.7}
        >
          <Icon
            name="close"
            size={20}
            color={theme.colors.textMuted}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: {
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  text1: {},
  text2: {
    marginTop: 2,
  },
  close: {
    marginLeft: 8,
    padding: 4,
  },
});

export function ToastProvider({ children }: PropsWithChildren) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const config = useMemo(
    () => ({
      success: (p: ToastCardProps) => <ToastCard {...p} />,
      error: (p: ToastCardProps) => <ToastCard {...p} />,
      info: (p: ToastCardProps) => <ToastCard {...p} />,
      warn: (p: ToastCardProps) => <ToastCard {...p} />,
      default: (p: ToastCardProps) => <ToastCard {...p} />,
    }),
    []
  );

  return (
    <>
      {children}
      <ToastManager
        config={config}
        position="top"
        duration={3200}
        theme="dark"
        animationStyle="slide"
        showProgressBar={false}
        showCloseIcon={true}
        topOffset={insets.top + 12}
        width="91%"
        minHeight={56}
        style={{
          borderRadius: theme.radii.lg,
          overflow: "hidden",
        }}
        textStyle={{
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamilySemiBold,
          fontSize: theme.typography.fontSizeBody,
        }}
      />
    </>
  );
}
