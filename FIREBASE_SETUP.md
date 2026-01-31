
# Firebase Authentication Setup Guide

This app now uses Firebase Authentication instead of Better Auth. Follow these steps to configure Firebase OAuth providers.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com))
2. Firebase CLI installed (optional, for easier configuration)

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Navigate to **Authentication** → **Sign-in method**
4. Enable the authentication providers you want to use:
   - Email/Password
   - Google
   - Apple (iOS only)

## Step 2: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Add a web app if you haven't already
4. Copy the Firebase configuration object

## Step 3: Configure Google OAuth (Optional)

### For Web:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Create OAuth 2.0 Client ID for Web application
5. Add authorized JavaScript origins:
   - `http://localhost:8081` (for development)
   - Your production domain
6. Add authorized redirect URIs:
   - `http://localhost:8081/__/auth/handler` (for development)
   - `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler`

### For iOS:
1. In Firebase Console, go to **Authentication** → **Sign-in method** → **Google**
2. Download the `GoogleService-Info.plist` file
3. Place it in the root of your project
4. Add the reversed client ID to your app's URL schemes in `app.json`

### For Android:
1. In Firebase Console, go to **Authentication** → **Sign-in method** → **Google**
2. Download the `google-services.json` file
3. Place it in the root of your project
4. Add SHA-1 fingerprint in Firebase project settings

## Step 4: Configure Apple Sign In (iOS Only)

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a new **Services ID** for Sign in with Apple
4. Configure the Service ID with your domain and redirect URLs
5. Create a **Key** for Sign in with Apple
6. In Firebase Console, go to **Authentication** → **Sign-in method** → **Apple**
7. Enter your Service ID, Team ID, and upload the Key file

## Step 5: Update app.json

Add your Firebase configuration to `app.json`:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "YOUR_BACKEND_URL",
      "firebaseApiKey": "YOUR_API_KEY",
      "firebaseAuthDomain": "YOUR_PROJECT_ID.firebaseapp.com",
      "firebaseProjectId": "YOUR_PROJECT_ID",
      "firebaseStorageBucket": "YOUR_PROJECT_ID.appspot.com",
      "firebaseMessagingSenderId": "YOUR_MESSAGING_SENDER_ID",
      "firebaseAppId": "YOUR_APP_ID"
    }
  }
}
```

## Step 6: Configure Backend

The backend needs Firebase Admin SDK credentials. Set these environment variables:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=base64_encoded_private_key
```

To get these credentials:
1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file
4. Extract the values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → Base64 encode it → `FIREBASE_PRIVATE_KEY`

To base64 encode the private key:
```bash
echo -n "YOUR_PRIVATE_KEY_HERE" | base64
```

## Step 7: Add Google Services Files (Native Apps)

### iOS:
1. Place `GoogleService-Info.plist` in the root of your project
2. The file is referenced in `app.json` under `ios.googleServicesFile`

### Android:
1. Place `google-services.json` in the root of your project
2. The file is referenced in `app.json` under `android.googleServicesFile`

## Step 8: Rebuild the App

After configuration, rebuild your app:

```bash
# For development
npm run dev

# For iOS build
eas build --platform ios

# For Android build
eas build --platform android
```

## Testing

1. Start the app: `npm run dev`
2. Try signing in with:
   - Email/Password (should work immediately)
   - Google (requires OAuth setup)
   - Apple (requires OAuth setup, iOS only)

## Troubleshooting

### "OAuth not configured" error
- Make sure you've enabled the provider in Firebase Console
- Verify your OAuth credentials are correct
- Check that redirect URIs are properly configured

### "Invalid API key" error
- Verify the API key in `app.json` matches your Firebase project
- Make sure you're using the correct Firebase project

### "Token verification failed" on backend
- Ensure backend environment variables are set correctly
- Verify the private key is properly base64 encoded
- Check that the Firebase project ID matches

## Security Notes

1. **Never commit** `GoogleService-Info.plist` or `google-services.json` to version control
2. **Never commit** Firebase private keys or service account credentials
3. Use environment variables for sensitive configuration
4. Enable App Check in Firebase for additional security
5. Configure authorized domains in Firebase Console

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google OAuth Setup](https://firebase.google.com/docs/auth/web/google-signin)
- [Apple Sign In Setup](https://firebase.google.com/docs/auth/ios/apple)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
