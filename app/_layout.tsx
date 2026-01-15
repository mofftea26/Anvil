import "react-native-reanimated";
import "react-native-url-polyfill/auto";

import { defaultLanguage } from "../src/shared/i18n/i18n";

import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Provider as ReduxProvider } from "react-redux";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthBootstrap } from "../src/features/auth/components/AuthBootstrap";
import { AppErrorBoundary } from "../src/shared/components/AppErrorBoundary";
import { applyRtlIfNeeded } from "../src/shared/i18n/rtl";
import { AppAlertProvider, darkTheme, ThemeProvider, ToastProvider } from "../src/shared/ui";
import { store } from "../src/store/store";
applyRtlIfNeeded(defaultLanguage);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <AppAlertProvider>
            <AuthBootstrap />
            <SafeAreaProvider>
              <SafeAreaView
                edges={["top"]}
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
