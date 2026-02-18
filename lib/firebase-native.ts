
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// Configure Google Sign-In for native platforms
// TODO: Replace with your Web Client ID from Firebase Console
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

export const configureGoogleSignIn = () => {
  if (Platform.OS !== 'web') {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
    });
    console.log('[Firebase Native] Google Sign-In configured');
  }
};

export const signInWithGoogleNative = async () => {
  if (Platform.OS === 'web') {
    throw new Error('Use web Google Sign-In for web platform');
  }

  try {
    console.log('[Firebase Native] Starting Google Sign-In');
    
    // Check if device supports Google Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    console.log('[Firebase Native] Google Sign-In successful:', userInfo.data?.user.email);
    
    // Get Google credential
    const { data } = userInfo;
    if (!data?.idToken) {
      throw new Error('No ID token received from Google');
    }
    
    const googleCredential = GoogleAuthProvider.credential(data.idToken);
    
    // Sign in to Firebase with Google credential
    const result = await signInWithCredential(auth, googleCredential);
    console.log('[Firebase Native] Firebase sign-in successful:', result.user.email);
    
    return result;
  } catch (error: any) {
    console.error('[Firebase Native] Google Sign-In error:', error);
    throw error;
  }
};

export const signOutGoogleNative = async () => {
  if (Platform.OS !== 'web') {
    try {
      await GoogleSignin.signOut();
      console.log('[Firebase Native] Google Sign-Out successful');
    } catch (error) {
      console.error('[Firebase Native] Google Sign-Out error:', error);
    }
  }
};
