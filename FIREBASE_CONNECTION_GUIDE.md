
# 🔥 Firebase Connection Guide for PMO Connect

## Current Setup

Your project is configured to use **Firebase Web SDK** (not React Native Firebase). This is the recommended approach for Expo projects as it works seamlessly across iOS, Android, and Web without requiring native configuration files.

## Step 1: Remove Conflicting Packages

The build errors occur because you have React Native Firebase packages installed that aren't being used. Remove them:

```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth @bacons/apple-targets
```

## Step 2: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ → Project Settings
4. Scroll down to "Your apps" section
5. Click the Web app icon `</>` (or add a new web app if you haven't)
6. Copy the `firebaseConfig` object

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 3: Update app.json with Your Firebase Config

Open `app.json` and replace the placeholder values in the `extra` section:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev",
      "firebaseApiKey": "AIzaSyC...",  // ← Your actual API key
      "firebaseAuthDomain": "your-project.firebaseapp.com",  // ← Your auth domain
      "firebaseProjectId": "your-project-id",  // ← Your project ID
      "firebaseStorageBucket": "your-project.appspot.com",  // ← Your storage bucket
      "firebaseMessagingSenderId": "123456789",  // ← Your sender ID
      "firebaseAppId": "1:123456789:web:abc123"  // ← Your app ID
    }
  }
}
```

## Step 4: Enable Authentication Methods in Firebase

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable the authentication methods you want:
   - ✅ **Email/Password** - Enable this
   - ✅ **Google** - Enable and configure OAuth consent screen
   - ✅ **Apple** - Enable (requires Apple Developer account)

## Step 5: Configure OAuth Redirect URLs

For OAuth to work in your Expo app, add these authorized domains:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   - `localhost` (for local development)
   - Your Expo development URL (e.g., `*.exp.direct`)
   - Your production domain (if you have one)

## Step 6: Test Your Connection

Run your app:
```bash
npm run dev
```

Try signing up with email/password. Check the console logs - you should see:
```
🔥 Firebase: Initializing with config: { projectId: 'your-project-id', ... }
✅ Firebase: App initialized
✅ Firebase Auth: Initialized for native with AsyncStorage persistence
```

## Architecture

Your app uses:
- **Firebase Web SDK** (`firebase` package v12.8.0)
- **Firebase Auth** for authentication
- **AsyncStorage** for persistence on mobile
- **Web browser persistence** on web

This setup works across all platforms without native configuration files!

## Troubleshooting

### Build still fails with GoogleService-Info.plist error?
- Make sure you've uninstalled `@react-native-firebase/app` and `@react-native-firebase/auth`
- Run `npm install` to clean up dependencies
- Clear Expo cache: `expo start -c`

### Authentication not working?
- Check that you've enabled the auth methods in Firebase Console
- Verify your `app.json` has the correct Firebase config values
- Check console logs for Firebase initialization messages

### OAuth not working?
- Ensure authorized domains are configured in Firebase Console
- For Google OAuth, configure the OAuth consent screen
- For Apple OAuth, you need an Apple Developer account

## Security Note

The Firebase API key in `app.json` is safe to expose in client-side code. Firebase uses security rules to protect your data, not the API key. However, make sure to:
1. Set up proper Firebase Security Rules
2. Enable App Check for production (optional but recommended)
3. Never commit sensitive service account keys to your repo

## Next Steps

Once Firebase is connected:
1. Your email/password authentication will work immediately
2. OAuth (Google/Apple) requires additional setup in Firebase Console
3. All user sessions are persisted automatically via AsyncStorage
4. Users stay logged in across app restarts

Need help? Check the Firebase docs: https://firebase.google.com/docs/auth
