import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ScreenshotsProvider } from "../src/context/ScreenshotsContext";

export default function RootLayout() {
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
