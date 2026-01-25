
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
  initialRouteName: "auth", // Start with auth screen to prevent flash of home screen
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = React.useState(false);

  // Main authentication and routing logic
  React.useEffect(() => {
    if (loading) {
      console.log("RootLayout: Auth loading, waiting...");
      return;
    }

    const inAuthGroup = segments[0] === "auth" || segments[0] === "auth-popup" || segments[0] === "auth-callback";
    const inOnboarding = segments[0] === "onboarding";
    const inTabs = segments[0] === "(tabs)";

    console.log("RootLayout: Auth check - user:", user?.email, "segments:", segments, "inAuthGroup:", inAuthGroup);

    // CRITICAL: If no user, ALWAYS redirect to auth (except if already in auth screens)
    if (!user) {
      if (!inAuthGroup) {
        console.log("RootLayout: No user found, redirecting to /auth");
        setOnboardingChecked(false); // Reset onboarding check
        router.replace("/auth");
      }
      return;
    }

    // User is authenticated - now check onboarding
    console.log("RootLayout: User authenticated:", user.email);

    // If user just signed in and is still on auth screen, check onboarding
    if (inAuthGroup) {
      console.log("RootLayout: User on auth screen, checking onboarding status");
      checkOnboardingAndRedirect();
      return;
    }

    // If user is trying to access tabs without onboarding check, verify onboarding
    if (inTabs && !onboardingChecked) {
      console.log("RootLayout: User accessing tabs, verifying onboarding status");
      checkOnboardingAndRedirect();
      return;
    }

    // If user is not in onboarding and onboarding wasn't checked, check it
    if (!inOnboarding && !onboardingChecked) {
      console.log("RootLayout: Verifying onboarding status");
      checkOnboardingAndRedirect();
    }
  }, [user, loading, segments, onboardingChecked, router]);

  const checkOnboardingAndRedirect = React.useCallback(async () => {
    if (!user) {
      console.log("RootLayout: No user, skipping onboarding check");
      return;
    }

    console.log("RootLayout: Checking onboarding status for user:", user.email);

    try {
      const Constants = await import("expo-constants");
      const BACKEND_URL = Constants.default.expoConfig?.extra?.backendUrl || "http://localhost:3000";
      const { authenticatedGet } = await import("@/utils/api");
      
      const profile = await authenticatedGet(`${BACKEND_URL}/api/users/me`);
      console.log("RootLayout: Profile data - onboardingCompleted:", profile.onboardingCompleted);

      setOnboardingChecked(true);

      if (!profile.onboardingCompleted) {
        console.log("RootLayout: Onboarding not completed, redirecting to /onboarding");
        router.replace("/onboarding");
      } else {
        console.log("RootLayout: Onboarding completed, redirecting to home");
        router.replace("/(tabs)/(home)");
      }
    } catch (error) {
      console.error("RootLayout: Error checking onboarding status:", error);
      // If we can't check, assume onboarding is needed
      setOnboardingChecked(true);
      router.replace("/onboarding");
    }
  }, [user, router]);

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
              {/* Onboarding screen */}
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
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
