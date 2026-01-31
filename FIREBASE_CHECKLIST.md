
# ✅ Firebase Setup Checklist

Follow these steps in order to connect Firebase to your PMO Connect app.

## Step 1: Clean Up Conflicting Packages ⚠️

The build error you're seeing is because of conflicting Firebase packages. Run this command:

```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth @bacons/apple-targets
```

Then reinstall:

```bash
npm install
```

**Why?** Your app uses Firebase Web SDK (the `firebase` package), not React Native Firebase. The React Native Firebase packages require native config files that you don't need.

---

## Step 2: Get Firebase Configuration 🔥

1. ☐ Go to https://console.firebase.google.com/
2. ☐ Select your project (or click "Add project" to create one)
3. ☐ Click the gear icon ⚙️ next to "Project Overview"
4. ☐ Click "Project Settings"
5. ☐ Scroll down to "Your apps" section
6. ☐ If you don't have a web app, click the `</>` icon to add one
7. ☐ Copy the `firebaseConfig` object

It looks like this:

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

---

## Step 3: Update app.json 📝

1. ☐ Open `app.json` in your project
2. ☐ Find the `extra` section
3. ☐ Replace the placeholder values with your actual Firebase config:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev",
      "firebaseApiKey": "AIzaSyC...",  // ← Your actual API key
      "firebaseAuthDomain": "your-project.firebaseapp.com",
      "firebaseProjectId": "your-project-id",
      "firebaseStorageBucket": "your-project.appspot.com",
      "firebaseMessagingSenderId": "123456789",
      "firebaseAppId": "1:123456789:web:abc123"
    }
  }
}
```

4. ☐ Save the file

---

## Step 4: Enable Authentication Methods 🔐

1. ☐ In Firebase Console, click "Authentication" in the left sidebar
2. ☐ Click "Get started" if this is your first time
3. ☐ Click the "Sign-in method" tab
4. ☐ Click "Email/Password"
5. ☐ Toggle "Enable" to ON
6. ☐ Click "Save"

**Optional - Enable OAuth:**

For Google Sign-In:
- ☐ Click "Google" in the sign-in methods
- ☐ Toggle "Enable" to ON
- ☐ Enter your support email
- ☐ Click "Save"

For Apple Sign-In:
- ☐ Click "Apple" in the sign-in methods
- ☐ Toggle "Enable" to ON
- ☐ You'll need an Apple Developer account for this

---

## Step 5: Test Your Connection 🧪

1. ☐ Start your app:
   ```bash
   npm run dev
   ```

2. ☐ In your app, navigate to the test screen:
   - Open the app
   - Navigate to `/test-firebase` route

3. ☐ Check the console logs. You should see:
   ```
   🔥 Firebase: Initializing with config: { projectId: 'your-project-id', ... }
   ✅ Firebase: App initialized
   ✅ Firebase Auth: Initialized for native with AsyncStorage persistence
   ```

4. ☐ On the test screen, tap "1. Test Sign Up"
   - Should see: ✅ Sign Up Success!

5. ☐ Tap "2. Test Sign In"
   - Should see: ✅ Sign In Success!

6. ☐ Tap "3. Test Sign Out"
   - Should see: ✅ Sign Out Success!

---

## Step 6: Try Real Authentication 🎉

1. ☐ Go to the auth screen in your app
2. ☐ Tap "Sign up with email"
3. ☐ Enter your email and password
4. ☐ Tap "Sign Up"
5. ☐ Check your email for verification link (if enabled)

If everything works, you're done! 🎊

---

## Troubleshooting 🔧

### ❌ Build still fails with GoogleService-Info.plist error

**Solution:** You didn't uninstall the React Native Firebase packages. Run:

```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth @bacons/apple-targets
npm install
expo start -c
```

### ❌ "Firebase: Error (auth/invalid-api-key)"

**Solution:** Your Firebase API key in `app.json` is incorrect. Double-check you copied it correctly from Firebase Console.

### ❌ "Firebase: Error (auth/operation-not-allowed)"

**Solution:** Email/Password authentication is not enabled in Firebase Console. Go to Authentication → Sign-in method → Enable Email/Password.

### ❌ Test screen shows "YOUR_FIREBASE_API_KEY"

**Solution:** You haven't updated `app.json` with your actual Firebase config yet. See Step 3.

### ❌ OAuth not working

**Solution:** 
- For Google: Configure OAuth consent screen in Google Cloud Console
- For Apple: You need an Apple Developer account
- Add authorized domains in Firebase Console → Authentication → Settings → Authorized domains

---

## What You've Accomplished ✨

After completing this checklist:

✅ Removed conflicting React Native Firebase packages
✅ Connected your app to Firebase using the Web SDK
✅ Enabled email/password authentication
✅ Tested the connection successfully
✅ Your app can now authenticate users on iOS, Android, and Web

**No native configuration files needed!** 🎉

---

## Next Steps 🚀

- Customize your authentication UI
- Add user profile creation flow
- Set up Firebase Security Rules
- Enable additional OAuth providers
- Deploy your app with EAS Build

Need more help? Check:
- `QUICK_FIREBASE_SETUP.md` - Quick reference guide
- `FIREBASE_CONNECTION_GUIDE.md` - Detailed documentation
- Firebase docs: https://firebase.google.com/docs/auth
