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
import { StatusBar } from "expo-status-bar";
import { Provider as ReduxProvider } from "react-redux";
import { TamaguiProvider } from "tamagui";

import { KeyboardScreen } from "@/src/shared/components/KeyboardScreen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthBootstrap } from "../src/features/auth/components/AuthBootstrap";
import { applyRtlIfNeeded } from "../src/shared/i18n/rtl";
import { tamaguiConfig } from "../src/shared/theme/tamagui.config";
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
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <AuthBootstrap />
        <SafeAreaProvider>
          <SafeAreaView
            edges={["top"]}
            style={{
              flex: 1,
              backgroundColor: "#0B0D10",
            }}
          >
            <KeyboardScreen>
              <Stack screenOptions={{ headerShown: false }} />
            </KeyboardScreen>
          </SafeAreaView>
        </SafeAreaProvider>
        <StatusBar style="light" />
      </TamaguiProvider>
    </ReduxProvider>
  );
}
