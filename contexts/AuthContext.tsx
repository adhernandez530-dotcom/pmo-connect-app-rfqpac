
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { authClient, storeWebBearerToken, BEARER_TOKEN_KEY } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

async function storeBearerToken(token: string) {
  console.log("AuthContext: Storing bearer token");
  if (Platform.OS === "web") {
    localStorage.setItem(BEARER_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(BEARER_TOKEN_KEY, token);
  }
}

async function clearBearerToken() {
  console.log("AuthContext: Clearing bearer token");
  if (Platform.OS === "web") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(BEARER_TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      console.log("AuthContext: Fetching user session");
      setLoading(true);
      const session = await authClient.getSession();
      if (session?.data?.user && session?.data?.session) {
        console.log("AuthContext: User session found:", session.data.user.email);
        setUser(session.data.user as User);
        
        // Store the bearer token for API calls
        const token = session.data.session.token;
        if (token) {
          console.log("AuthContext: Storing session token for API calls");
          await storeBearerToken(token);
        }
      } else {
        console.log("AuthContext: No user session found");
        setUser(null);
        await clearBearerToken();
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch user:", error);
      setUser(null);
      await clearBearerToken();
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("AuthContext: Signing in with email:", email);
      const result = await authClient.signIn.email({ email, password });
      console.log("AuthContext: Sign in API call completed");
      
      // Store the bearer token
      if (result?.data?.session?.token) {
        console.log("AuthContext: Storing bearer token from sign in response");
        await storeBearerToken(result.data.session.token);
      }
      
      await fetchUser();
      console.log("AuthContext: Sign in successful");
    } catch (error: any) {
      console.error("AuthContext: Email sign in failed:", error);
      console.error("AuthContext: Error details:", JSON.stringify(error, null, 2));
      
      // Extract meaningful error message with better context
      let errorMessage = "Sign in failed. Please try again.";
      
      // Check for specific error types
      if (error?.status === 403 || error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
        errorMessage = "The authentication service is currently being updated. Please wait a moment and try again.";
      } else if (error?.status === 401 || error?.message?.includes("401") || error?.message?.includes("Invalid credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error?.status === 400 || error?.message?.includes("400")) {
        errorMessage = "Invalid request. Please check your email and password format.";
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch") || error?.message?.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.body?.message) {
        errorMessage = error.body.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log("AuthContext: Signing up with email:", email, "name:", name);
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || undefined,
      });
      console.log("AuthContext: Sign up API call completed");
      
      // Store the bearer token
      if (result?.data?.session?.token) {
        console.log("AuthContext: Storing bearer token from sign up response");
        await storeBearerToken(result.data.session.token);
      }
      
      await fetchUser();
      console.log("AuthContext: Sign up successful, user should be redirected to onboarding");
    } catch (error: any) {
      console.error("AuthContext: Email sign up failed:", error);
      console.error("AuthContext: Error details:", JSON.stringify(error, null, 2));
      
      // Extract meaningful error message with better context
      let errorMessage = "Sign up failed. Please try again.";
      
      // Check for specific error types
      if (error?.status === 403 || error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
        errorMessage = "The authentication service is currently being updated. Please wait a moment and try again.";
      } else if (error?.status === 400 || error?.message?.includes("400")) {
        errorMessage = "Invalid request. Please check your email and password format.";
      } else if (error?.message?.includes("already exists") || error?.message?.includes("duplicate")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error?.message?.includes("invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error?.message?.includes("password")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch") || error?.message?.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.body?.message) {
        errorMessage = error.body.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      console.log("AuthContext: Signing in with", provider, "on platform:", Platform.OS);
      if (Platform.OS === "web") {
        console.log("AuthContext: Opening OAuth popup for", provider);
        const token = await openOAuthPopup(provider);
        console.log("AuthContext: OAuth popup returned token");
        storeWebBearerToken(token);
        await storeBearerToken(token);
        await fetchUser();
      } else {
        console.log("AuthContext: Starting native OAuth flow for", provider);
        const result = await authClient.signIn.social({
          provider,
          callbackURL: "/",
        });
        
        // Store the bearer token
        if (result?.data?.session?.token) {
          console.log("AuthContext: Storing bearer token from social sign in response");
          await storeBearerToken(result.data.session.token);
        }
        
        await fetchUser();
      }
      console.log("AuthContext:", provider, "sign in successful");
    } catch (error: any) {
      console.error(`AuthContext: ${provider} sign in failed:`, error);
      console.error("AuthContext: Error details:", JSON.stringify(error, null, 2));
      
      // Extract meaningful error message with better context
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      let errorMessage = `${providerName} sign in failed. Please try again.`;
      
      // Check for specific error types
      if (error?.status === 403 || error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
        errorMessage = `The authentication service is currently being updated. Please wait a moment and try ${providerName} sign in again, or use email sign in.`;
      } else if (error?.status === 401 || error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
        errorMessage = `${providerName} authentication failed. Please check your ${providerName} account settings.`;
      } else if (error?.message?.includes("cancelled") || error?.message?.includes("canceled")) {
        // Don't show error for user cancellation
        console.log("AuthContext: User cancelled OAuth flow");
        return;
      } else if (error?.message?.includes("popup")) {
        errorMessage = `Please allow popups in your browser to sign in with ${providerName}.`;
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch") || error?.message?.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.body?.message) {
        errorMessage = error.body.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      console.log("AuthContext: Signing out");
      await authClient.signOut();
      await clearBearerToken();
      setUser(null);
      console.log("AuthContext: Sign out successful");
    } catch (error) {
      console.error("AuthContext: Sign out failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
