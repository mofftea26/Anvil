import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";

export const useRootFonts = () =>
  useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
