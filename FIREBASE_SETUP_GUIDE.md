
# Firebase Authentication Setup Guide

This app now uses Firebase Authentication with Google Sign-In. Follow these steps to complete the setup:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

## 2. Register Your App

### For Web:
1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the Web icon (</>)
3. Register your app with a nickname (e.g., "PMO Connect Web")
4. Copy the Firebase configuration object

### For iOS:
1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the iOS icon
3. Enter your iOS bundle ID: `com.pmoconnect.app`
4. Download the `GoogleService-Info.plist` file
5. Add it to your iOS project

### For Android:
1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the Android icon
3. Enter your Android package name: `com.pmoconnect.app`
4. Download the `google-services.json` file
5. Add it to your Android project at `android/app/google-services.json`

## 3. Enable Authentication Methods

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable **Email/Password** authentication
3. Enable **Google** authentication
   - Click on Google provider
   - Enable it
   - Add your support email
   - Save

## 4. Configure Your App

### Update Firebase Configuration

Open `lib/firebase.ts` and replace the placeholder values with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### Update Google Sign-In Configuration

Open `lib/firebase-native.ts` and replace the Web Client ID:

```typescript
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
```

**Where to find Web Client ID:**
1. Go to Firebase Console > Project Settings
2. Scroll down to "Your apps"
3. Click on your Web app
4. Copy the Web Client ID (it ends with `.apps.googleusercontent.com`)

## 5. Configure OAuth Consent Screen (for Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "OAuth consent screen"
4. Configure the consent screen:
   - User Type: External
   - App name: PMO Connect
   - User support email: your email
   - Developer contact: your email
5. Add scopes: `email`, `profile`, `openid`
6. Add test users if in testing mode

## 6. Add Authorized Domains

1. In Firebase Console, go to Authentication > Settings
2. Under "Authorized domains", add:
   - Your production domain (e.g., `pmoconnect.com`)
   - `localhost` (for local testing)
   - Your Expo development URL if needed

## 7. Test Your Setup

1. Run your app: `npm run dev`
2. Navigate to the Firebase Auth screen
3. Try signing up with email/password
4. Try signing in with Google

## 8. Platform-Specific Setup

### iOS Additional Steps:
1. Add URL scheme to `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.pmoconnect.app",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

2. Install the config plugin:
```bash
npx expo install @react-native-firebase/app
```

### Android Additional Steps:
1. Add Google Services plugin to `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.pmoconnect.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app"
    ]
  }
}
```

## 9. Update App Entry Point

The app now uses `FirebaseAuthProvider` instead of `AuthProvider`. The auth screen is at `/firebase-auth`.

To make it the default screen, update your navigation logic to redirect unauthenticated users to `/firebase-auth`.

## Troubleshooting

### "Firebase not configured" error
- Make sure you've replaced all placeholder values in `lib/firebase.ts`
- Check that your Firebase project is active

### Google Sign-In not working on native
- Verify Web Client ID is correct in `lib/firebase-native.ts`
- Make sure Google Sign-In is enabled in Firebase Console
- Check that SHA-1 fingerprint is added for Android (if using)

### "Popup blocked" on web
- The app will automatically fall back to redirect flow
- Make sure your domain is in Firebase authorized domains

## Security Notes

1. **Never commit** your Firebase config files to public repositories
2. Add `GoogleService-Info.plist` and `google-services.json` to `.gitignore`
3. Use environment variables for sensitive data in production
4. Enable App Check for additional security (optional but recommended)

## Next Steps

After Firebase is configured:
1. Test all authentication flows
2. Set up Firebase Security Rules for your database (if using Firestore)
3. Configure email templates in Firebase Console
4. Set up password reset functionality
5. Add email verification if needed

For more information, visit:
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [Google Sign-In Setup](https://firebase.google.com/docs/auth/web/google-signin)
