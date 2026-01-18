import { Redirect, Stack } from "expo-router";
import { useAppSelector } from "../../src/shared/hooks/useAppSelector";

export default function TrainerLayout() {
  const auth = useAppSelector((s) => s.auth);
  const me = useAppSelector((s) => s.profile.me);

  if (auth.status === "unauthenticated") {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (auth.status === "authenticated" && me?.role === "client") {
    return <Redirect href="/(client)/(tabs)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Trainer tabs (Dashboard / Library / Clients / Profile) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Library stack (Programs / Workouts / Exercises / Dictionary) */}
      <Stack.Screen name="library" options={{ headerShown: false }} />

      {/* Existing client screen route */}
      <Stack.Screen name="client/[clientId]" options={{ headerShown: false }} />
    </Stack>
  );
}
