
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
      
      console.log("AuthContext: Session response:", {
        hasSession: !!session?.data?.session,
        hasUser: !!session?.data?.user,
        userEmail: session?.data?.user?.email,
        sessionToken: session?.data?.session?.token ? "present" : "missing",
      });
      
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
      const result = await authClient.signIn.email({ 
        email, 
        password,
      });
      console.log("AuthContext: Sign in API call completed, result:", {
        hasData: !!result?.data,
        hasSession: !!result?.data?.session,
        hasUser: !!result?.data?.user,
      });
      
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
      const result = await authClient.signUp.email({
        email,
        password,
        name: name || undefined,
      });
      console.log("AuthContext: Sign up API call completed, result:", {
        hasData: !!result?.data,
        hasSession: !!result?.data?.session,
        hasUser: !!result?.data?.user,
      });
      
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
      console.log("🚀 AuthContext: Starting", provider, "sign in on platform:", Platform.OS);
      console.log("🚀 AuthContext: Current URL:", Platform.OS === "web" ? window.location.href : "N/A");
      
      if (Platform.OS === "web") {
        console.log("🌐 AuthContext: Web platform detected - initiating OAuth redirect");
        console.log("🌐 AuthContext: Callback URL will be:", window.location.origin + "/auth-callback");
        
        // On web, Better Auth will redirect the current page to the OAuth provider
        // The callback URL will bring the user back to the app with the session set
        try {
          console.log("🌐 AuthContext: Calling authClient.signIn.social with provider:", provider);
          const result = await authClient.signIn.social({
            provider,
            callbackURL: window.location.origin + "/auth-callback",
          });
          
          console.log("✅ AuthContext: OAuth redirect initiated successfully, result:", result);
          // Note: The page will redirect, so code after this won't execute
        } catch (redirectError: any) {
          console.error("❌ AuthContext: OAuth redirect failed:", redirectError);
          console.error("❌ AuthContext: Error type:", typeof redirectError);
          console.error("❌ AuthContext: Error keys:", Object.keys(redirectError || {}));
          console.error("❌ AuthContext: Error message:", redirectError?.message);
          console.error("❌ AuthContext: Error status:", redirectError?.status);
          throw redirectError;
        }
      } else {
        console.log("📱 AuthContext: Native platform detected - starting native OAuth flow");
        const result = await authClient.signIn.social({
          provider,
          callbackURL: "/",
        });
        
        console.log("📱 AuthContext: Native OAuth result:", result);
        
        // Fetch user session after successful social sign in
        await fetchUser();
        console.log("✅ AuthContext:", provider, "sign in successful on native");
      }
    } catch (error: any) {
      console.error(`❌ AuthContext: ${provider} sign in failed:`, error);
      console.error("❌ AuthContext: Error type:", typeof error);
      console.error("❌ AuthContext: Error message:", error?.message);
      console.error("❌ AuthContext: Error status:", error?.status);
      console.error("❌ AuthContext: Error response:", error?.response);
      console.error("❌ AuthContext: Full error details:", JSON.stringify(error, null, 2));
      
      // Extract meaningful error message with better context
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      let errorMessage = `${providerName} sign in failed. Please try again.`;
      
      // Check for specific error types
      if (error?.status === 403 || error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
        errorMessage = `The authentication service is currently being updated. Please wait a moment and try ${providerName} sign in again, or use email sign in.`;
      } else if (error?.status === 401 || error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
        errorMessage = `${providerName} authentication failed. Please check your ${providerName} account settings.`;
      } else if (error?.status === 404 || error?.message?.includes("404") || error?.message?.includes("not found")) {
        errorMessage = `${providerName} sign in is not available yet. The authentication service is being set up. Please try email sign in or wait a moment.`;
      } else if (error?.status === 500 || error?.message?.includes("500") || error?.message?.includes("Internal Server Error")) {
        errorMessage = `${providerName} sign in encountered a server error. The OAuth provider may not be configured yet. Please try email sign in or contact support.`;
      } else if (error?.message?.includes("cancelled") || error?.message?.includes("canceled")) {
        // Don't show error for user cancellation
        console.log("ℹ️ AuthContext: User cancelled OAuth flow");
        return;
      } else if (error?.message?.includes("popup") || error?.message?.includes("blocked")) {
        errorMessage = `Please allow popups in your browser to sign in with ${providerName}.`;
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch") || error?.message?.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error?.message?.includes("redirect")) {
        errorMessage = `${providerName} OAuth redirect failed. The provider may not be configured correctly. Please try email sign in.`;
      } else if (error?.body?.message) {
        errorMessage = error.body.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = () => {
    console.log("🔵 AuthContext: signInWithGoogle called");
    return signInWithSocial("google");
  };
  
  const signInWithApple = () => {
    console.log("🔵 AuthContext: signInWithApple called");
    return signInWithSocial("apple");
  };

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
