import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ScreenshotsProvider } from "../src/context/ScreenshotsContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ScreenshotsProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="unused"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="recent"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </ScreenshotsProvider>
    </SafeAreaProvider>
  );
}
