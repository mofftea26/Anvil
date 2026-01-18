import React, { PropsWithChildren, useMemo } from "react";
import ToastManager from "toastify-react-native";
import { useTheme } from "../theme";

export function ToastProvider({ children }: PropsWithChildren) {
  const theme = useTheme();

  const customToastTypes = useMemo(
    () => ({
      success: {
        backgroundColor: theme.colors.surface,
        indicator: "✓",
        iconColor: theme.colors.accent,
        textColor: theme.colors.text,
      },
      error: {
        backgroundColor: theme.colors.surface,
        indicator: "!",
        iconColor: theme.colors.danger,
        textColor: theme.colors.text,
      },
      info: {
        backgroundColor: theme.colors.surface,
        indicator: "i",
        iconColor: theme.colors.accent2,
        textColor: theme.colors.text,
      },
      warn: {
        backgroundColor: theme.colors.surface,
        indicator: "!",
        iconColor: theme.colors.accent2,
        textColor: theme.colors.text,
      },
    }),
    [theme]
  );

  return (
    <>
      {children}
      <ToastManager
        position="top"
        duration={3200}
        customToastTypes={customToastTypes as any}
        containerStyle={{
          borderRadius: theme.radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginHorizontal: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: theme.colors.surface,
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

