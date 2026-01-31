
# 🚀 Quick Start Guide - Firebase Authentication

Get up and running with Firebase authentication in 5 minutes!

## ⚡ Prerequisites

- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- A Firebase project (free tier is fine)

## 📋 Step-by-Step Setup

### Step 1: Configure Firebase (5 minutes)

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Create a new project** (or select existing)
3. **Enable Email/Password Authentication**:
   - Click **Authentication** in the left sidebar
   - Click **Get Started** (if first time)
   - Click **Sign-in method** tab
   - Click **Email/Password**
   - Toggle **Enable**
   - Click **Save**

4. **Get Firebase Configuration**:
   - Click the gear icon (⚙️) next to **Project Overview**
   - Click **Project settings**
   - Scroll down to **Your apps** section
   - Click **Web** icon (`</>`) to add a web app
   - Register your app (name: "PMO Connect")
   - Copy the Firebase configuration object

5. **Update app.json**:
   - Open `app.json` in your project
   - Replace the Firebase placeholders with your actual values:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev",
      "firebaseApiKey": "AIzaSyC...",  // Your actual API key
      "firebaseAuthDomain": "your-project.firebaseapp.com",
      "firebaseProjectId": "your-project-id",
      "firebaseStorageBucket": "your-project.appspot.com",
      "firebaseMessagingSenderId": "123456789",
      "firebaseAppId": "1:123456789:web:abc123"
    }
  }
}
```

### Step 2: Start the App (1 minute)

```bash
npm run dev
```

Press `w` to open in web browser (recommended for first test).

### Step 3: Test Authentication (3 minutes)

#### Create a Test Account

1. You should see the **Welcome** screen
2. Tap **"Sign up with Email"**
3. Fill in the form:
   - **Full Name**: Test User
   - **Email**: test@example.com
   - **Password**: test123456
   - **Confirm Password**: test123456
4. Tap **"Sign Up"**
5. You should see a success message

#### Verify Email

1. Check your email inbox for verification email
2. Click the verification link
3. Return to the app
4. The app should detect verification and proceed

#### Complete Onboarding

1. You'll be on the **Onboarding** screen
2. Choose a username (e.g., "testuser")
3. Complete the steps (you can skip optional ones)
4. Tap **"Complete Setup"**
5. You should be redirected to the home screen

#### Test Sign Out & Sign In

1. Go to **Profile** tab
2. Tap **Settings** icon
3. Scroll down and tap **"Log Out"**
4. Confirm sign out
5. You should be back at the **Welcome** screen
6. Tap **"Already have an account? Sign in"**
7. Enter:
   - **Email**: test@example.com
   - **Password**: test123456
8. Tap **"Sign In"**
9. You should be signed in and see the home screen

## ✅ Success!

If you completed all the steps above, your Firebase authentication is working! 🎉

## 🧪 What to Test Next

### 1. Session Persistence

- Close the app completely
- Reopen the app
- You should still be signed in (no need to sign in again)

### 2. Password Reset

- Sign out
- Tap **"Forgot Password?"** on sign-in screen
- Enter your email
- Check your email for reset link
- Click the link and set a new password
- Sign in with the new password

### 3. Protected API Endpoints

- Create a post (tap + button on home screen)
- View your feed
- Send a message to a friend
- All these should work with Firebase authentication

## 🐛 Troubleshooting

### "Backend URL not configured"

**Solution**: Make sure `backendUrl` is set in `app.json` under `expo.extra.backendUrl`

### "Firebase API key not configured"

**Solution**: Replace the placeholder values in `app.json` with your actual Firebase configuration

### "Email not sent"

**Solution**: 
- Check spam folder
- Verify Email/Password provider is enabled in Firebase Console
- Check Firebase Console → Authentication → Templates for email configuration

### "Can't sign in"

**Solution**:
- Make sure you verified your email
- Check that you're using the correct password
- Try password reset if you forgot your password

### "Redirect loop after sign-in"

**Solution**:
- Clear app data/cache
- Restart the app
- Make sure Firebase configuration is correct

## 📊 Sample Test Credentials

For testing purposes, you can create multiple test accounts:

| Email | Password | Purpose |
|-------|----------|---------|
| test@example.com | test123456 | Primary test account |
| user1@example.com | test123456 | Secondary test account |
| user2@example.com | test123456 | Third test account |

## 🎯 Next Steps

### For Development

1. **Test all authentication flows** (see `FIREBASE_AUTH_TESTING_GUIDE.md`)
2. **Test protected API endpoints** (posts, messages, friends, etc.)
3. **Test on different platforms** (web, iOS, Android)

### For Production

1. **Configure OAuth** (Google, Apple) - see `FIREBASE_SETUP.md`
2. **Set up Firebase App Check** for security
3. **Configure production Firebase project**
4. **Set up Firebase Analytics**
5. **Customize email templates** in Firebase Console

## 📚 Additional Resources

- **`FIREBASE_AUTH_TESTING_GUIDE.md`** - Comprehensive testing guide
- **`FIREBASE_SETUP.md`** - Detailed Firebase setup instructions
- **`INTEGRATION_COMPLETE.md`** - Integration summary
- **`MIGRATION_SUMMARY.md`** - Migration from Better Auth to Firebase

## 🆘 Need Help?

1. Check the console logs for detailed error messages
2. Verify Firebase configuration in `app.json`
3. Check Firebase Console for authentication logs
4. Review the testing guide for common issues

## 🎉 You're All Set!

Your Firebase authentication is now fully integrated and ready to use. Happy coding! 🚀

---

**Pro Tips:**

- 💡 Use the web version for initial testing (easier to debug)
- 💡 Check the browser console for detailed logs
- 💡 Keep Firebase Console open to monitor authentication events
- 💡 Test on multiple devices to ensure cross-platform compatibility
