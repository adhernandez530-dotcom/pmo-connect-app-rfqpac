
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import { authClient, storeWebBearerToken } from "@/lib/auth";

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
      if (session?.data?.user) {
        console.log("AuthContext: User session found:", session.data.user.email);
        setUser(session.data.user as User);
      } else {
        console.log("AuthContext: No user session found");
        setUser(null);
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("AuthContext: Signing in with email:", email);
      const result = await authClient.signIn.email({ email, password });
      console.log("AuthContext: Sign in API call completed, result:", result);
      await fetchUser();
      console.log("AuthContext: Sign in successful");
    } catch (error: any) {
      console.error("AuthContext: Email sign in failed:", error);
      // Extract meaningful error message
      const errorMessage = error?.body?.message || error?.message || "Sign in failed. Please check your credentials.";
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
      console.log("AuthContext: Sign up API call completed, result:", result);
      await fetchUser();
      console.log("AuthContext: Sign up successful, user should be redirected to onboarding");
    } catch (error: any) {
      console.error("AuthContext: Email sign up failed:", error);
      // Extract meaningful error message
      const errorMessage = error?.body?.message || error?.message || "Sign up failed. Please try again.";
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
        await fetchUser();
      } else {
        console.log("AuthContext: Starting native OAuth flow for", provider);
        await authClient.signIn.social({
          provider,
          callbackURL: "/",
        });
        await fetchUser();
      }
      console.log("AuthContext:", provider, "sign in successful");
    } catch (error: any) {
      console.error(`AuthContext: ${provider} sign in failed:`, error);
      // Extract meaningful error message
      const errorMessage = error?.message || `${provider} sign in failed. Please try again.`;
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
