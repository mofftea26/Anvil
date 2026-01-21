import React, { useMemo, useState } from "react";
import type { TextInputProps, ViewStyle } from "react-native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { useTheme } from "../theme";
import { Icon } from "./Icon";
import { Text } from "./Text";

export type InputProps = {
  label: string;
  error?: string;
  type?: "text" | "password";
  autoGrow?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
} & Omit<TextInputProps, "onChange"> & {
    value?: string;
    onChangeText?: (text: string) => void;
  };

export function Input({
  label,
  error,
  type = "text",
  autoGrow = false,
  value,
  onChangeText,
  placeholder,
  containerStyle,
  leftIcon,
  ...props
}: InputProps) {
  const { t } = useAppTranslation();
  const theme = useTheme();
  const isPassword = type === "password";
  const isMultiline = Boolean(props.multiline);

  const [visible, setVisible] = useState(false);
  const [multilineHeight, setMultilineHeight] = useState<number | undefined>(undefined);

  const secureTextEntry = useMemo(() => {
    if (!isPassword) return false;
    return !visible;
  }, [isPassword, visible]);

  const placeholderTextColor = "rgba(255,255,255,0.45)";

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text variant="caption" style={{ opacity: 0.9 }}>
        {label}
      </Text>

      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
          isMultiline
            ? {
                height: autoGrow ? multilineHeight : undefined,
                minHeight: 110,
                alignItems: "flex-start",
                paddingVertical: 12,
              }
            : null,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          onContentSizeChange={(e) => {
            if (!isMultiline || !autoGrow) return;
            const next = Math.max(110, Math.ceil(e.nativeEvent.contentSize.height) + 24);
            if (next !== multilineHeight) setMultilineHeight(next);
          }}
          style={[
            styles.input,
            { color: theme.colors.text, fontFamily: theme.typography.fontFamilyRegular },
            isMultiline ? { textAlignVertical: "top", paddingVertical: 0 } : null,
          ]}
          {...props}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              visible ? t("common.hidePassword") : t("common.showPassword")
            }
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Icon
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={theme.colors.textMuted}
              strokeWidth={1.5}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color={theme.colors.danger}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  leftIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
    input: {
    flex: 1,
    paddingVertical: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});

