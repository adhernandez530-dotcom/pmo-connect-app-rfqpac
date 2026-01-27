
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { authClient } from "@/lib/auth";

export default function AuthPopupScreen() {
  const { provider } = useLocalSearchParams<{ provider: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      console.log("AuthPopup: Not on web platform, skipping");
      return;
    }

    console.log("AuthPopup: Starting OAuth flow for provider:", provider);

    if (!provider || !["google", "github", "apple"].includes(provider)) {
      const errorMsg = "Invalid provider";
      console.error("AuthPopup: Invalid provider:", provider);
      setError(errorMsg);
      window.opener?.postMessage({ type: "oauth-error", error: errorMsg }, "*");
      setTimeout(() => window.close(), 2000);
      return;
    }

    // Start the OAuth flow
    const startOAuth = async () => {
      try {
        console.log("AuthPopup: Calling authClient.signIn.social for", provider);
        await authClient.signIn.social({
          provider: provider as any,
          callbackURL: `${window.location.origin}/auth-callback`,
        });
        console.log("AuthPopup: OAuth redirect initiated");
      } catch (err: any) {
        console.error("AuthPopup: OAuth initiation failed:", err);
        setError(err.message || "Failed to start authentication");
        window.opener?.postMessage({ 
          type: "oauth-error", 
          error: err.message || "Failed to start authentication" 
        }, "*");
        setTimeout(() => window.close(), 2000);
      }
    };

    startOAuth();
  }, [provider]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>✗</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.subText}>This window will close automatically...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Redirecting to sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: "#333",
  },
  errorIcon: {
    fontSize: 48,
    color: "#FF3B30",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
