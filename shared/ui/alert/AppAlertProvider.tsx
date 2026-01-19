import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../theme";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Text } from "../components/Text";
import { VStack, HStack } from "../layout/Stack";

export type AppAlertButton = {
  text: string;
  variant?: "primary" | "secondary" | "destructive";
  onPress?: () => void;
};

export type AppAlertOptions = {
  title?: string;
  message?: string;
  buttons?: AppAlertButton[];
  dismissable?: boolean;
};

export type AppAlertPromptOptions = {
  title: string;
  message?: string;
  label: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
};

type AppAlertContextValue = {
  show: (opts: AppAlertOptions) => void;
  hide: () => void;
  confirm: (opts: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }) => void;
  prompt: (opts: AppAlertPromptOptions) => void;
};

const AppAlertContext = React.createContext<AppAlertContextValue | null>(null);

export function useAppAlert(): AppAlertContextValue {
  const ctx = React.useContext(AppAlertContext);
  if (!ctx) throw new Error("useAppAlert must be used within AppAlertProvider");
  return ctx;
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [opts, setOpts] = React.useState<AppAlertOptions>({});
  const [promptOpts, setPromptOpts] = React.useState<AppAlertPromptOptions | null>(null);
  const [promptValue, setPromptValue] = React.useState("");

  const hide = React.useCallback(() => {
    setOpen(false);
    setOpts({});
    setPromptOpts(null);
    setPromptValue("");
  }, []);

  const show = React.useCallback((next: AppAlertOptions) => {
    setPromptOpts(null);
    setOpts(next);
    setOpen(true);
  }, []);

  const confirm = React.useCallback<AppAlertContextValue["confirm"]>(
    ({ title, message, confirmText = "OK", cancelText = "Cancel", destructive, onConfirm }) => {
      show({
        title,
        message,
        dismissable: true,
        buttons: [
          { text: cancelText, variant: "secondary", onPress: hide },
          {
            text: confirmText,
            variant: destructive ? "destructive" : "primary",
            onPress: async () => {
              hide();
              await onConfirm();
            },
          },
        ],
      });
    },
    [hide, show]
  );

  const prompt = React.useCallback<AppAlertContextValue["prompt"]>(
    (next) => {
      setOpts({});
      setPromptOpts(next);
      setPromptValue("");
      setOpen(true);
    },
    []
  );

  const value = React.useMemo<AppAlertContextValue>(
    () => ({ show, hide, confirm, prompt }),
    [show, hide, confirm, prompt]
  );

  const buttons = opts.buttons?.length
    ? opts.buttons
    : [{ text: "OK", variant: "primary", onPress: hide }];

  const cardStyle: ViewStyle = {
    borderRadius: theme.radii.xl,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: theme.colors.surface,
  };

  const isPrompt = promptOpts != null;
  const dismissable = isPrompt ? true : opts.dismissable;

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => (dismissable ? hide() : undefined)}
      >
        <Pressable
          style={[
            styles.backdrop,
            { backgroundColor: "rgba(0,0,0,0.62)" },
          ]}
          onPress={() => (dismissable ? hide() : undefined)}
        >
          <Pressable
            onPress={() => {}}
            style={{ width: "100%", paddingHorizontal: 16 }}
          >
            <Card padded style={cardStyle}>
              <VStack style={{ gap: 12 }}>
                {isPrompt ? (
                  <>
                    {promptOpts.title ? (
                      <Text weight="bold" style={{ fontSize: 18 }}>
                        {promptOpts.title}
                      </Text>
                    ) : null}
                    {promptOpts.message ? (
                      <Text muted style={{ lineHeight: 20 }}>
                        {promptOpts.message}
                      </Text>
                    ) : null}
                    <Input
                      label={promptOpts.label}
                      value={promptValue}
                      onChangeText={setPromptValue}
                      placeholder={promptOpts.placeholder}
                      autoCapitalize="words"
                    />
                    <HStack gap={10} style={{ marginTop: 4 }}>
                      <Button
                        variant="secondary"
                        fullWidth
                        style={{ flex: 1 }}
                        onPress={hide}
                      >
                        {promptOpts.cancelText ?? "Cancel"}
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        style={{ flex: 1 }}
                        onPress={() => {
                          const trimmed = promptValue.trim();
                          if (!trimmed) return;
                          hide();
                          promptOpts.onConfirm(trimmed);
                        }}
                      >
                        {promptOpts.confirmText ?? "OK"}
                      </Button>
                    </HStack>
                  </>
                ) : (
                  <>
                    {opts.title ? (
                      <Text weight="bold" style={{ fontSize: 18 }}>
                        {opts.title}
                      </Text>
                    ) : null}

                    {opts.message ? (
                      <Text muted style={{ lineHeight: 20 }}>
                        {opts.message}
                      </Text>
                    ) : null}

                    <HStack gap={10} style={{ marginTop: 4 }}>
                      {buttons.map((b, idx) => {
                        const variant =
                          b.variant === "destructive"
                            ? "secondary"
                            : b.variant ?? "primary";

                        const destructiveText =
                          b.variant === "destructive"
                            ? { color: theme.colors.danger }
                            : null;

                        return (
                          <Button
                            key={`${b.text}-${idx}`}
                            variant={variant as "primary" | "secondary" | "ghost"}
                            fullWidth
                            style={{ flex: 1 }}
                            textStyle={destructiveText as any}
                            onPress={() => {
                              if (b.onPress) b.onPress();
                              else hide();
                            }}
                          >
                            {b.text}
                          </Button>
                        );
                      })}
                    </HStack>
                  </>
                )}
              </VStack>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </AppAlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

