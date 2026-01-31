
# 🚀 Quick Firebase Setup (3 Steps)

## The Problem You Had

Your build was failing because you had **React Native Firebase** packages installed (`@react-native-firebase/app`, `@react-native-firebase/auth`) which require native configuration files (`GoogleService-Info.plist` for iOS, `google-services.json` for Android).

However, your code is actually using the **Firebase Web SDK** (the `firebase` package), which doesn't need those files!

## The Solution

### Step 1: Remove the conflicting packages

Run this command in your terminal:

```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth @bacons/apple-targets
```

Then reinstall dependencies:

```bash
npm install
```

### Step 2: Get your Firebase config

1. Go to https://console.firebase.google.com/
2. Select your project (or create one)
3. Click ⚙️ → **Project Settings**
4. Scroll to "Your apps" → Click **Web** icon `</>`
5. Copy the config values

### Step 3: Update app.json

Replace the placeholder values in `app.json` under `expo.extra`:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "AIzaSyC...",  // ← Paste your actual values here
      "firebaseAuthDomain": "your-project.firebaseapp.com",
      "firebaseProjectId": "your-project-id",
      "firebaseStorageBucket": "your-project.appspot.com",
      "firebaseMessagingSenderId": "123456789",
      "firebaseAppId": "1:123456789:web:abc123"
    }
  }
}
```

### Step 4: Enable Email/Password Auth in Firebase

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Email/Password** → Enable → Save

## That's It! 🎉

Now run your app:

```bash
npm run dev
```

Your Firebase authentication will work on iOS, Android, and Web without any native configuration files!

## Why This Works

- **Firebase Web SDK** works across all platforms in Expo
- No need for `GoogleService-Info.plist` or `google-services.json`
- No need for native Firebase packages
- Simpler setup, same functionality
- Works in Expo Go and production builds

## Verify It's Working

When you start your app, check the console. You should see:

```
🔥 Firebase: Initializing with config: { projectId: 'your-project-id', ... }
✅ Firebase: App initialized
✅ Firebase Auth: Initialized for native with AsyncStorage persistence
```

If you see these logs, Firebase is connected! ✅

## Next: Enable OAuth (Optional)

If you want Google/Apple sign-in:

1. **Google OAuth:**
   - Firebase Console → Authentication → Sign-in method → Google → Enable
   - Configure OAuth consent screen in Google Cloud Console

2. **Apple OAuth:**
   - Firebase Console → Authentication → Sign-in method → Apple → Enable
   - Requires Apple Developer account

## Need Help?

- Check `FIREBASE_CONNECTION_GUIDE.md` for detailed troubleshooting
- Firebase docs: https://firebase.google.com/docs/auth/web/start
- Your current Firebase setup is in `lib/firebase.ts`
