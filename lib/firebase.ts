
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Firebase configuration
// These should be set in your Firebase project settings
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "AIzaSyDummyKeyForDevelopment",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "pmo-connect.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "pmo-connect",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "pmo-connect.appspot.com",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "123456789",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "1:123456789:web:abcdef",
};

console.log("🔥 Firebase: Initializing with config:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase: App initialized");
} else {
  app = getApp();
  console.log("✅ Firebase: Using existing app instance");
}

// Initialize Auth with platform-specific persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
  console.log("✅ Firebase Auth: Initialized for web");
} else {
  // For React Native, use AsyncStorage for persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log("✅ Firebase Auth: Initialized for native with AsyncStorage persistence");
}

// OAuth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export { auth, app };
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "";
