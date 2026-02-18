
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase configuration
// TODO: Replace with your Firebase project credentials from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  // Optional: measurementId for analytics
  // measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, firebaseSignOut, onAuthStateChanged };
export type { FirebaseUser };

// Auth functions
export const signInWithEmail = async (email: string, password: string) => {
  console.log('[Firebase] Signing in with email:', email);
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  console.log('[Firebase] Signing up with email:', email);
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  console.log('[Firebase] Signing in with Google');
  
  if (Platform.OS === 'web') {
    // Web: Use popup or redirect
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error: any) {
      // If popup blocked, try redirect
      if (error.code === 'auth/popup-blocked') {
        console.log('[Firebase] Popup blocked, using redirect');
        await signInWithRedirect(auth, googleProvider);
        return null; // Result will be available after redirect
      }
      throw error;
    }
  } else {
    // Native: Will be handled by @react-native-google-signin/google-signin
    throw new Error('Use native Google Sign-In for mobile platforms');
  }
};

export const signOut = async () => {
  console.log('[Firebase] Signing out');
  return firebaseSignOut(auth);
};

// Check for redirect result on web
export const checkRedirectResult = async () => {
  if (Platform.OS === 'web') {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('[Firebase] Redirect result:', result.user.email);
        return result;
      }
    } catch (error) {
      console.error('[Firebase] Redirect result error:', error);
      throw error;
    }
  }
  return null;
};
