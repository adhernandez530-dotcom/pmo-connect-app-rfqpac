
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { colors } from "@/styles/commonStyles";
// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) {
      console.log("RootLayout: Auth loading, waiting...");
      return;
    }

    const inAuthGroup = segments[0] === "auth" || segments[0] === "auth-popup" || segments[0] === "auth-callback";

    console.log("RootLayout: Auth check - user:", user?.email, "inAuthGroup:", inAuthGroup, "segments:", segments);

    if (!user && !inAuthGroup) {
      console.log("RootLayout: User not authenticated, redirecting to /auth");
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      console.log("RootLayout: User authenticated, redirecting to /(tabs)");
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
      background: colors.background, // Use app background color
      card: colors.backgroundAlt, // Use app card color
      text: colors.text, // Use app text color
      border: colors.border, // Use app border color
      notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
    },
  };
  return (
    <>
      <StatusBar style="auto" animated />
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <WidgetProvider>
            <GestureHandlerRootView>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: colorScheme === "dark" ? colors.background : "rgb(255, 255, 255)",
                },
                headerTintColor: colorScheme === "dark" ? colors.text : "rgb(0, 0, 0)",
                contentStyle: {
                  backgroundColor: colorScheme === "dark" ? colors.background : "rgb(242, 242, 247)",
                },
              }}
            >
              {/* Auth screens */}
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
              <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
              {/* Main app with tabs */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* Chat screen */}
              <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
              {/* User profile screen */}
              <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
              {/* Notifications screen */}
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              {/* Edit profile screen */}
              <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
              {/* Settings screen */}
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              {/* Privacy settings screen */}
              <Stack.Screen name="privacy-settings" options={{ headerShown: false }} />
              {/* Notification settings screen */}
              <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
              {/* Permissions settings screen */}
              <Stack.Screen name="permissions-settings" options={{ headerShown: false }} />
              {/* Blocked users screen */}
              <Stack.Screen name="blocked-users" options={{ headerShown: false }} />
              {/* Privacy Policy screen */}
              <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
              {/* Terms of Service screen */}
              <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
              {/* Onboarding screen */}
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            </Stack>
            <SystemBars style={"auto"} />
            </GestureHandlerRootView>
          </WidgetProvider>
        </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
