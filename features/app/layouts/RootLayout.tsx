import "react-native-reanimated";
import "react-native-url-polyfill/auto";

import { useRootFonts } from "@/features/app/hooks/useRootFonts";
import { AuthBootstrap } from "@/features/auth/components/AuthBootstrap";
import { defaultLanguage } from "@/shared/i18n/i18n";
import { Stack } from "expo-router";
import { Provider as ReduxProvider } from "react-redux";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppErrorBoundary } from "@/shared/components/AppErrorBoundary";
import { applyRtlIfNeeded } from "@/shared/i18n/rtl";
import {
  AppAlertProvider,
  darkTheme,
  ThemeProvider,
  ToastProvider,
} from "@/shared/ui";
import { store } from "@/store/store";
applyRtlIfNeeded(defaultLanguage);

export default function RootLayout() {
  const [fontsLoaded] = useRootFonts();

  if (!fontsLoaded) return null;

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <AppAlertProvider>
            <AuthBootstrap />
            <SafeAreaProvider>
              <SafeAreaView
                edges={["top", "bottom"]}
                style={{
                  flex: 1,
                  backgroundColor: darkTheme.colors.background,
                }}
              >
                <AppErrorBoundary>
                  <Stack screenOptions={{ headerShown: false }} />
                </AppErrorBoundary>
              </SafeAreaView>
            </SafeAreaProvider>
          </AppAlertProvider>
        </ToastProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
