
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { authClient } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_CHECK_KEY = "putmeon_session_checked";

function openOAuthPopup(provider: string): Promise<void> {
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
      if (event.data?.type === "oauth-success") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve();
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

async function markSessionChecked() {
  console.log("AuthContext: Marking session as checked");
  if (Platform.OS === "web") {
    localStorage.setItem(SESSION_CHECK_KEY, "true");
  } else {
    await SecureStore.setItemAsync(SESSION_CHECK_KEY, "true");
  }
}

async function clearSessionCheck() {
  console.log("AuthContext: Clearing session check marker");
  if (Platform.OS === "web") {
    localStorage.removeItem(SESSION_CHECK_KEY);
  } else {
    await SecureStore.deleteItemAsync(SESSION_CHECK_KEY);
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
        await markSessionChecked();
      } else {
        console.log("AuthContext: No user session found");
        setUser(null);
        await clearSessionCheck();
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch user:", error);
      setUser(null);
      await clearSessionCheck();
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("AuthContext: Signing in with email:", email);
      await authClient.signIn.email({ 
        email, 
        password,
      });
      console.log("AuthContext: Sign in API call completed");
      
      // Fetch user session after successful sign in
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
      await authClient.signUp.email({
        email,
        password,
        name: name || undefined,
      });
      console.log("AuthContext: Sign up API call completed");
      
      // Fetch user session after successful sign up
      await fetchUser();
      console.log("AuthContext: Sign up successful, user should be redirected to email verification");
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

  const signInWithSocial = async (provider: "google" | "apple") => {
    try {
      console.log("AuthContext: Signing in with", provider, "on platform:", Platform.OS);
      if (Platform.OS === "web") {
        console.log("AuthContext: Opening OAuth popup for", provider);
        await openOAuthPopup(provider);
        console.log("AuthContext: OAuth popup completed, fetching user session");
        await fetchUser();
      } else {
        console.log("AuthContext: Starting native OAuth flow for", provider);
        await authClient.signIn.social({
          provider,
          callbackURL: "/",
        });
        
        // Fetch user session after successful social sign in
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

  const forgotPassword = async (email: string) => {
    try {
      console.log("AuthContext: Requesting password reset for email:", email);
      
      // Import API helper
      const { apiPost } = await import("@/utils/api");
      
      // Call backend to request password reset
      await apiPost("/api/auth/request-password-reset", { email });
      
      console.log("AuthContext: Password reset email sent successfully");
    } catch (error: any) {
      console.error("AuthContext: Forgot password failed:", error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to send password reset email. Please try again.";
      
      if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      console.log("AuthContext: Resending verification email");
      
      // Import API helper
      const { authenticatedPost } = await import("@/utils/api");
      
      // Call backend to resend verification email
      // Note: This endpoint requires authentication
      await authenticatedPost("/api/auth/send-verification-email", {});
      
      console.log("AuthContext: Verification email resent successfully");
    } catch (error: any) {
      console.error("AuthContext: Resend verification failed:", error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to resend verification email. Please try again.";
      
      if (error?.message?.includes("Authentication session not found")) {
        errorMessage = "Please sign in again to resend verification email.";
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      console.log("AuthContext: Signing out");
      await authClient.signOut();
      await clearSessionCheck();
      setUser(null);
      console.log("AuthContext: Sign out successful");
    } catch (error) {
      console.error("AuthContext: Sign out failed:", error);
      // Even if signOut fails, clear local state
      await clearSessionCheck();
      setUser(null);
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
        forgotPassword,
        resendVerificationEmail,
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
