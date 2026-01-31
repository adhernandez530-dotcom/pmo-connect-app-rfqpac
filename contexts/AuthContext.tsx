
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, appleProvider, BACKEND_URL } from '@/lib/firebase';

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

// Convert Firebase user to our User type
function convertFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
  if (!firebaseUser) return null;
  
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || undefined,
    image: firebaseUser.photoURL || undefined,
    emailVerified: firebaseUser.emailVerified,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: Setting up auth state listener");
    
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthContext: Auth state changed:", {
        hasUser: !!firebaseUser,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified,
      });
      
      const convertedUser = convertFirebaseUser(firebaseUser);
      setUser(convertedUser);
      setLoading(false);
      
      // If user is signed in, sync with backend
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          console.log("AuthContext: Got Firebase ID token, syncing with backend");
          
          // Verify token with backend
          const response = await fetch(`${BACKEND_URL}/api/auth/verify-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("AuthContext: Backend verification successful:", data);
          } else {
            console.error("AuthContext: Backend verification failed:", response.status);
          }
        } catch (error) {
          console.error("AuthContext: Failed to sync with backend:", error);
        }
      }
    });
    
    // Check for redirect result on web
    if (Platform.OS === 'web') {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log("AuthContext: OAuth redirect result received:", result.user.email);
          }
        })
        .catch((error) => {
          console.error("AuthContext: OAuth redirect error:", error);
        });
    }
    
    return () => {
      console.log("AuthContext: Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const fetchUser = async () => {
    // Firebase handles this automatically via onAuthStateChanged
    console.log("AuthContext: fetchUser called (handled by onAuthStateChanged)");
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("AuthContext: Signing in with email:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: Sign in successful:", userCredential.user.email);
    } catch (error: any) {
      console.error("AuthContext: Email sign in failed:", error);
      
      let errorMessage = "Sign in failed. Please try again.";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log("AuthContext: Signing up with email:", email, "name:", name);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("AuthContext: Sign up successful:", userCredential.user.email);
      
      // Update profile with display name if provided
      if (name && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name,
        });
        console.log("AuthContext: Profile updated with name:", name);
      }
      
      // Send email verification
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        console.log("AuthContext: Verification email sent");
      }
    } catch (error: any) {
      console.error("AuthContext: Email sign up failed:", error);
      
      let errorMessage = "Sign up failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signInWithSocial = async (provider: 'google' | 'apple') => {
    try {
      console.log("🚀 AuthContext: Starting", provider, "sign in on platform:", Platform.OS);
      
      const authProvider = provider === 'google' ? googleProvider : appleProvider;
      
      if (Platform.OS === 'web') {
        console.log("🌐 AuthContext: Web platform detected - using popup for OAuth");
        
        try {
          const result = await signInWithPopup(auth, authProvider);
          console.log("✅ AuthContext: OAuth popup successful:", result.user.email);
        } catch (popupError: any) {
          // If popup is blocked, fall back to redirect
          if (popupError.code === 'auth/popup-blocked') {
            console.log("🌐 AuthContext: Popup blocked, falling back to redirect");
            await signInWithRedirect(auth, authProvider);
          } else {
            throw popupError;
          }
        }
      } else {
        console.log("📱 AuthContext: Native platform detected - OAuth not yet implemented for native");
        throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} sign in is not yet available on mobile. Please use email sign in.`);
      }
    } catch (error: any) {
      console.error(`❌ AuthContext: ${provider} sign in failed:`, error);
      
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      let errorMessage = `${providerName} sign in failed. Please try again.`;
      
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("ℹ️ AuthContext: User cancelled OAuth flow");
        return;
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = `Please allow popups in your browser to sign in with ${providerName}.`;
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = `An account already exists with this email using a different sign-in method.`;
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
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
      await sendPasswordResetEmail(auth, email);
      console.log("AuthContext: Password reset email sent successfully");
    } catch (error: any) {
      console.error("AuthContext: Forgot password failed:", error);
      
      let errorMessage = "Failed to send password reset email. Please try again.";
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      console.log("AuthContext: Resending verification email");
      
      if (!auth.currentUser) {
        throw new Error("Please sign in again to resend verification email.");
      }
      
      await sendEmailVerification(auth.currentUser);
      console.log("AuthContext: Verification email resent successfully");
    } catch (error: any) {
      console.error("AuthContext: Resend verification failed:", error);
      
      let errorMessage = "Failed to resend verification email. Please try again.";
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      console.log("AuthContext: Signing out");
      await firebaseSignOut(auth);
      setUser(null);
      console.log("AuthContext: Sign out successful");
    } catch (error) {
      console.error("AuthContext: Sign out failed:", error);
      // Even if signOut fails, clear local state
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
