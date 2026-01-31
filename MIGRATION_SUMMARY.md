
# OAuth Migration to Firebase - Summary

## What Was Changed

### Frontend Changes

1. **Installed Firebase Dependencies**
   - `firebase` - Firebase JavaScript SDK
   - `@react-native-firebase/app` - React Native Firebase core
   - `@react-native-firebase/auth` - React Native Firebase Authentication
   - `@react-native-async-storage/async-storage` - For Firebase persistence on native

2. **Created New Firebase Configuration** (`lib/firebase.ts`)
   - Initializes Firebase app with configuration from `app.json`
   - Sets up Firebase Auth with platform-specific persistence
   - Configures Google and Apple OAuth providers
   - Supports both web and native platforms

3. **Updated AuthContext** (`contexts/AuthContext.tsx`)
   - Replaced Better Auth client with Firebase Auth
   - Implemented Firebase authentication methods:
     - `signInWithEmailAndPassword` for email sign-in
     - `createUserWithEmailAndPassword` for email sign-up
     - `signInWithPopup` / `signInWithRedirect` for OAuth (web)
     - `sendPasswordResetEmail` for password reset
     - `sendEmailVerification` for email verification
     - `signOut` for logout
   - Added `onAuthStateChanged` listener for automatic session management
   - Converts Firebase user format to app's User interface

4. **Updated API Utilities** (`utils/api.ts`)
   - Replaced Better Auth session tokens with Firebase ID tokens
   - Updated `getFirebaseToken()` to retrieve Firebase ID tokens
   - Modified all authenticated API calls to use `Authorization: Bearer <firebase-token>` header
   - Removed Better Auth session cookie dependencies

5. **Updated Auth Screen** (`app/auth.tsx`)
   - Added Firebase setup modal for unconfigured OAuth providers
   - Provides step-by-step instructions for Firebase configuration
   - Shows helpful error messages when OAuth is not set up

6. **Updated app.json**
   - Added Firebase configuration placeholders in `extra` section
   - Added `@react-native-firebase/app` plugin
   - Added references to `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
   - Fixed scheme to be RFC1738 compliant (`pmoconnect`)

7. **Removed Better Auth Files**
   - Deleted `lib/auth.ts` (Better Auth client)
   - Deleted `app/auth-callback.tsx` (Better Auth OAuth callback)
   - Deleted `app/auth-popup.tsx` (Better Auth OAuth popup)

### Backend Status

The backend change request was submitted to switch from Better Auth to Firebase Admin SDK. The backend will:
- Install Firebase Admin SDK
- Create middleware to verify Firebase ID tokens
- Update all protected endpoints to use Firebase token verification
- Create `/api/auth/verify-token` endpoint for token validation

**Note:** The backend build completed but may still be using Better Auth. You may need to verify the backend implementation or submit another backend change request if needed.

## Configuration Required

### 1. Firebase Project Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication providers:
   - Email/Password
   - Google (optional)
   - Apple (optional, iOS only)

### 2. Get Firebase Configuration

From Firebase Console → Project Settings → General:
- Copy your Firebase configuration values
- Update `app.json` with these values:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "YOUR_API_KEY",
      "firebaseAuthDomain": "YOUR_PROJECT_ID.firebaseapp.com",
      "firebaseProjectId": "YOUR_PROJECT_ID",
      "firebaseStorageBucket": "YOUR_PROJECT_ID.appspot.com",
      "firebaseMessagingSenderId": "YOUR_SENDER_ID",
      "firebaseAppId": "YOUR_APP_ID"
    }
  }
}
```

### 3. Google OAuth Setup (Optional)

**For Web:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID for Web application
3. Add authorized JavaScript origins and redirect URIs
4. Enable Google sign-in in Firebase Console

**For iOS:**
1. Download `GoogleService-Info.plist` from Firebase
2. Place it in the project root
3. Add reversed client ID to URL schemes

**For Android:**
1. Download `google-services.json` from Firebase
2. Place it in the project root
3. Add SHA-1 fingerprint to Firebase project

### 4. Apple Sign In Setup (Optional, iOS Only)

1. Configure Sign in with Apple in Apple Developer Portal
2. Create Service ID and Key
3. Add configuration to Firebase Console
4. Download `GoogleService-Info.plist` with Apple configuration

### 5. Backend Configuration

Set these environment variables for the backend:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=base64_encoded_private_key
```

Get these from Firebase Console → Project Settings → Service Accounts → Generate New Private Key

## Testing

1. **Email Authentication** (should work immediately):
   - Sign up with email/password
   - Sign in with email/password
   - Password reset
   - Email verification

2. **Google OAuth** (requires configuration):
   - Sign in with Google (web: popup/redirect, native: not yet implemented)

3. **Apple Sign In** (requires configuration, iOS only):
   - Sign in with Apple (web: popup/redirect, native: not yet implemented)

## Known Limitations

1. **Native OAuth Not Implemented**
   - Google and Apple sign-in currently only work on web
   - Native implementation requires additional setup with `@react-native-firebase/auth`
   - Users on mobile will see a message to use email sign-in

2. **Backend May Still Use Better Auth**
   - The backend change was submitted but may not have fully migrated
   - Frontend sends Firebase ID tokens, but backend may not be verifying them yet
   - You may need to verify backend implementation

3. **OAuth Configuration Required**
   - Google and Apple OAuth require manual setup in Firebase Console
   - Without configuration, users will see setup instructions

## Next Steps

1. **Configure Firebase Project**
   - Set up Firebase project and enable authentication providers
   - Update `app.json` with Firebase configuration
   - Add Google Services files for native apps

2. **Test Authentication**
   - Test email sign-up and sign-in
   - Test OAuth providers (if configured)
   - Verify token verification on backend

3. **Implement Native OAuth** (optional)
   - Add native Google Sign-In for iOS/Android
   - Add native Apple Sign-In for iOS
   - Use `@react-native-firebase/auth` native methods

4. **Verify Backend Integration**
   - Check that backend is verifying Firebase ID tokens
   - Test protected API endpoints
   - Ensure user data is properly synced

## Documentation

- `FIREBASE_SETUP.md` - Detailed Firebase setup guide
- Firebase Auth Docs: https://firebase.google.com/docs/auth
- React Native Firebase: https://rnfirebase.io/

## Rollback Plan

If you need to rollback to Better Auth:

1. Reinstall Better Auth dependencies:
   ```bash
   npm install better-auth @better-auth/expo
   ```

2. Restore deleted files from git history:
   - `lib/auth.ts`
   - `app/auth-callback.tsx`
   - `app/auth-popup.tsx`

3. Revert `contexts/AuthContext.tsx` and `utils/api.ts` to use Better Auth

4. Remove Firebase configuration from `app.json`

## Support

For issues or questions:
- Check `FIREBASE_SETUP.md` for detailed setup instructions
- Review Firebase Console for configuration errors
- Check backend logs for token verification issues
- Verify Firebase configuration in `app.json` is correct
