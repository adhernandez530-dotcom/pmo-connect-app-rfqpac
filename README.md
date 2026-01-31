
# PMO Connect - Social Platform for Skills & Services

A social media platform that helps you discover and connect with people based on the services they offer and topics they're passionate about.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase (IMPORTANT!)

Your app uses Firebase for authentication. Follow these steps:

#### Remove Conflicting Packages

```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth @bacons/apple-targets
npm install
```

#### Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click ⚙️ → **Project Settings**
4. Scroll to "Your apps" → Click Web icon `</>`
5. Copy the configuration values

#### Update app.json

Replace the placeholder values in `app.json`:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "YOUR_ACTUAL_API_KEY",
      "firebaseAuthDomain": "your-project.firebaseapp.com",
      "firebaseProjectId": "your-project-id",
      "firebaseStorageBucket": "your-project.appspot.com",
      "firebaseMessagingSenderId": "123456789",
      "firebaseAppId": "1:123456789:web:abc123"
    }
  }
}
```

#### Enable Authentication in Firebase

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. (Optional) Enable **Google** and **Apple** for OAuth

### 3. Run the App

```bash
npm run dev
```

### 4. Test Firebase Connection

Navigate to `/test-firebase` in your app to verify Firebase is working correctly.

## 📚 Documentation

- **QUICK_FIREBASE_SETUP.md** - 3-step Firebase setup guide
- **FIREBASE_CONNECTION_GUIDE.md** - Detailed Firebase integration guide
- **FIREBASE_AUTH_TESTING_GUIDE.md** - Testing authentication flows
- **INTEGRATION_COMPLETE.md** - Backend integration status

## 🏗️ Architecture

- **Frontend:** React Native + Expo 54
- **Navigation:** Expo Router (file-based routing)
- **Authentication:** Firebase Auth (Web SDK)
- **Backend:** Specular API
- **State Management:** React Context API
- **Persistence:** AsyncStorage

## 🔥 Firebase Setup

This app uses the **Firebase Web SDK** (not React Native Firebase). This means:

✅ Works on iOS, Android, and Web
✅ No native configuration files needed
✅ No `GoogleService-Info.plist` or `google-services.json` required
✅ Simpler setup and deployment

## 🛠️ Key Features

- User authentication (Email/Password, Google, Apple)
- Profile creation with skills and services
- Social feed with posts, likes, comments, reposts
- Friend requests and messaging
- Search users by skills and services
- Privacy settings and content moderation
- Notifications
- Location-based discovery

## 📱 Platform Support

- ✅ iOS (Native)
- ✅ Android (Native)
- ✅ Web (PWA)

## 🔐 Security

- Firebase Authentication with secure token management
- AsyncStorage for persistent sessions
- Protected API endpoints with Bearer token authentication
- Privacy controls for user profiles and content

## 🐛 Troubleshooting

### Build fails with GoogleService-Info.plist error?

This means you still have React Native Firebase packages installed. Run:

```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth @bacons/apple-targets
npm install
expo start -c
```

### Authentication not working?

1. Check Firebase config in `app.json` is correct
2. Verify Email/Password auth is enabled in Firebase Console
3. Check console logs for Firebase initialization messages
4. Use `/test-firebase` screen to diagnose issues

### OAuth not working?

1. Configure OAuth consent screen in Google Cloud Console
2. Add authorized domains in Firebase Console
3. For Apple OAuth, you need an Apple Developer account

## 📦 Scripts

- `npm run dev` - Start development server with tunnel
- `npm run ios` - Start on iOS simulator
- `npm run android` - Start on Android emulator
- `npm run web` - Start web version
- `npm run build:web` - Build for web production
- `npm run build:android` - Prebuild for Android

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Private - All rights reserved
