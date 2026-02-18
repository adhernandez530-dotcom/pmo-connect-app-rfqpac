
import { Stack } from "expo-router";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    console.log('[RootLayout] App initialized on platform:', Platform.OS);
  }, []);

  return (
    <FirebaseAuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="firebase-auth" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
        <Stack.Screen name="email-signin" options={{ headerShown: false }} />
        <Stack.Screen name="email-signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="edit-profile" options={{ title: "Edit Profile" }} />
        <Stack.Screen name="create-post" options={{ title: "Create Post" }} />
        <Stack.Screen name="drafts" options={{ title: "Drafts" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="notification-settings" options={{ title: "Notification Settings" }} />
        <Stack.Screen name="privacy-settings" options={{ title: "Privacy Settings" }} />
        <Stack.Screen name="permissions-settings" options={{ title: "Permissions" }} />
        <Stack.Screen name="blocked-users" options={{ title: "Blocked Users" }} />
        <Stack.Screen name="privacy-policy" options={{ title: "Privacy Policy" }} />
        <Stack.Screen name="terms-of-service" options={{ title: "Terms of Service" }} />
        <Stack.Screen name="user/[id]" options={{ title: "Profile" }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </FirebaseAuthProvider>
  );
}
