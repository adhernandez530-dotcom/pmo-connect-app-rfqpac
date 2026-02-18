
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { 
  auth, 
  signInWithEmail as firebaseSignInWithEmail,
  signUpWithEmail as firebaseSignUpWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  checkRedirectResult,
  FirebaseUser
} from '@/lib/firebase';
import { 
  configureGoogleSignIn, 
  signInWithGoogleNative,
  signOutGoogleNative 
} from '@/lib/firebase-native';

interface User {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[FirebaseAuth] Initializing');
    
    // Configure Google Sign-In for native platforms
    if (Platform.OS !== 'web') {
      configureGoogleSignIn();
    }

    // Check for redirect result on web
    if (Platform.OS === 'web') {
      checkRedirectResult().catch((error) => {
        console.error('[FirebaseAuth] Redirect result error:', error);
      });
    }

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[FirebaseAuth] Auth state changed:', firebaseUser?.email || 'null');
      
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          image: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('[FirebaseAuth] Cleaning up');
      unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('[FirebaseAuth] Signing in with email:', email);
      await firebaseSignInWithEmail(email, password);
    } catch (error: any) {
      console.error('[FirebaseAuth] Email sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log('[FirebaseAuth] Signing up with email:', email);
      const result = await firebaseSignUpWithEmail(email, password);
      
      // TODO: Update user profile with name if provided
      // import { updateProfile } from 'firebase/auth';
      // if (name && result.user) {
      //   await updateProfile(result.user, { displayName: name });
      // }
      
      console.log('[FirebaseAuth] Sign-up successful:', result.user.email);
    } catch (error: any) {
      console.error('[FirebaseAuth] Email sign-up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[FirebaseAuth] Starting Google Sign-In');
      
      if (Platform.OS === 'web') {
        await firebaseSignInWithGoogle();
      } else {
        await signInWithGoogleNative();
      }
      
      console.log('[FirebaseAuth] Google Sign-In successful');
    } catch (error: any) {
      console.error('[FirebaseAuth] Google Sign-In error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const signOut = async () => {
    try {
      console.log('[FirebaseAuth] Signing out');
      
      // Sign out from Firebase
      await firebaseSignOut();
      
      // Sign out from Google on native
      if (Platform.OS !== 'web') {
        await signOutGoogleNative();
      }
      
      console.log('[FirebaseAuth] Sign-out successful');
    } catch (error: any) {
      console.error('[FirebaseAuth] Sign-out error:', error);
    } finally {
      // Always clear local state
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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
}
