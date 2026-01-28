
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

// CRITICAL: Always read backend URL from app.json configuration
// This is set automatically when the backend is deployed
const API_URL = Constants.expoConfig?.extra?.backendUrl || "";

if (!API_URL) {
  console.error("❌ CRITICAL: Backend URL not configured in app.json!");
  console.error("Please ensure expo.extra.backendUrl is set in app.json");
} else {
  console.log("✅ Auth client configured with backend URL:", API_URL);
}

// Platform-specific storage: localStorage for web, SecureStore for native
const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      deleteItem: (key: string) => localStorage.removeItem(key),
    }
  : SecureStore;

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "pmoconnect",
      storagePrefix: "pmoconnect",
      storage,
    }),
  ],
});

export { API_URL };
