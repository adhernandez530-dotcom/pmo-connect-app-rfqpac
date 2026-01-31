
# Firebase Authentication Testing Guide

This guide will help you test the Firebase authentication integration in your app.

## 🔥 Firebase Configuration Required

Before testing, you need to configure Firebase in your `app.json`:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Navigate to **Project Settings** → **General**
4. Copy your Firebase configuration values
5. Update `app.json` with your Firebase credentials:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://s5h67befddk3ypbuyxdfdzua87su4asz.app.specular.dev",
      "firebaseApiKey": "YOUR_ACTUAL_API_KEY",
      "firebaseAuthDomain": "YOUR_PROJECT_ID.firebaseapp.com",
      "firebaseProjectId": "YOUR_PROJECT_ID",
      "firebaseStorageBucket": "YOUR_PROJECT_ID.appspot.com",
      "firebaseMessagingSenderId": "YOUR_MESSAGING_SENDER_ID",
      "firebaseAppId": "YOUR_APP_ID"
    }
  }
}
```

6. Enable **Email/Password** authentication in Firebase Console:
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password** provider
   - Click **Save**

## 📱 Testing Email Authentication

### Test User Credentials

For testing purposes, create a test account with these credentials:

- **Email**: `test@example.com`
- **Password**: `test123456`

### 1. Sign Up Flow

1. Start the app: `npm run dev`
2. You should see the Welcome screen with authentication options
3. Tap **"Sign up with Email"**
4. Fill in the sign-up form:
   - **Full Name**: Test User
   - **Email**: test@example.com
   - **Password**: test123456
   - **Confirm Password**: test123456
5. Tap **"Sign Up"**
6. You should see a success message
7. You'll be redirected to the **Email Verification** screen

**Expected Behavior:**
- ✅ Form validation works (email format, password length, password match)
- ✅ Password visibility toggle works
- ✅ Loading indicator shows during sign-up
- ✅ Success modal appears on successful sign-up
- ✅ Redirects to email verification screen
- ✅ Verification email is sent to the provided email address

### 2. Email Verification Flow

1. After signing up, you should be on the **Verify Email** screen
2. Check your email inbox for the verification link
3. Click the verification link in the email
4. Return to the app
5. The app should automatically detect the verified email and proceed to onboarding

**Expected Behavior:**
- ✅ Verification screen shows the correct email address
- ✅ "Resend Verification Email" button works
- ✅ Can log out from verification screen
- ✅ After verification, app proceeds to onboarding

### 3. Sign In Flow

1. If you're signed in, tap the profile icon and sign out
2. You should be redirected to the Welcome screen
3. Tap **"Already have an account? Sign in"**
4. Fill in the sign-in form:
   - **Email**: test@example.com
   - **Password**: test123456
5. Tap **"Sign In"**
6. You should be signed in and redirected to the home screen

**Expected Behavior:**
- ✅ Form validation works
- ✅ Password visibility toggle works
- ✅ Loading indicator shows during sign-in
- ✅ Error modal shows for invalid credentials
- ✅ Successful sign-in redirects to home screen (or onboarding if profile incomplete)
- ✅ Session persists after app reload

### 4. Forgot Password Flow

1. From the Sign In screen, tap **"Forgot Password?"**
2. Enter your email: test@example.com
3. Tap **"Send Reset Link"**
4. Check your email for the password reset link
5. Click the link and enter a new password
6. Return to the app and sign in with the new password

**Expected Behavior:**
- ✅ Email validation works
- ✅ Success message shows after sending reset link
- ✅ Password reset email is received
- ✅ Can sign in with new password after reset

### 5. Onboarding Flow

After signing in for the first time (or if profile is incomplete):

1. You should be redirected to the **Onboarding** screen
2. Complete the onboarding steps:
   - **Step 1**: Choose a username and enter full name
   - **Step 2**: Add location and bio (optional)
   - **Step 3**: Add phone number and contact preferences (optional)
   - **Step 4**: Add services and knowledge topics (optional)
   - **Step 5**: Grant app permissions
3. Tap **"Complete Setup"**
4. You should be redirected to the home screen

**Expected Behavior:**
- ✅ Username availability check works
- ✅ Form validation works on each step
- ✅ Can navigate back and forth between steps
- ✅ Can skip optional steps
- ✅ Profile is created successfully
- ✅ Redirects to home screen after completion

### 6. Session Persistence

1. Sign in to the app
2. Close the app completely
3. Reopen the app
4. You should still be signed in (no need to sign in again)

**Expected Behavior:**
- ✅ User remains signed in after app restart
- ✅ No redirect loop to sign-in screen
- ✅ User data is loaded correctly

### 7. Sign Out Flow

1. Navigate to the Profile tab
2. Tap the Settings icon
3. Scroll down and tap **"Log Out"**
4. Confirm the sign-out action
5. You should be redirected to the Welcome screen

**Expected Behavior:**
- ✅ Confirmation modal appears
- ✅ User is signed out successfully
- ✅ Redirects to Welcome screen
- ✅ Local state is cleared
- ✅ Cannot access protected screens after sign-out

## 🔐 Testing OAuth (Google & Apple)

### Google Sign In (Web Only)

1. From the Welcome screen, tap **"Continue with Google"**
2. A popup window should open with Google sign-in
3. Sign in with your Google account
4. Grant permissions
5. You should be signed in and redirected to onboarding (first time) or home screen

**Expected Behavior:**
- ✅ Google OAuth popup opens
- ✅ Can sign in with Google account
- ✅ User profile is created with Google account info
- ✅ Redirects to onboarding or home screen

**Note**: Google Sign In currently only works on web. On native (iOS/Android), you'll see a message to use email sign-in instead.

### Apple Sign In (iOS Web Only)

1. From the Welcome screen, tap **"Continue with Apple"** (iOS only)
2. A popup window should open with Apple sign-in
3. Sign in with your Apple ID
4. Grant permissions
5. You should be signed in and redirected to onboarding or home screen

**Expected Behavior:**
- ✅ Apple OAuth popup opens
- ✅ Can sign in with Apple ID
- ✅ User profile is created with Apple account info
- ✅ Redirects to onboarding or home screen

**Note**: Apple Sign In currently only works on web. Native implementation requires additional setup.

## 🐛 Common Issues & Troubleshooting

### Issue: "Backend URL not configured"

**Solution**: Make sure `backendUrl` is set in `app.json` under `expo.extra.backendUrl`

### Issue: "Firebase API key not configured"

**Solution**: Update `app.json` with your actual Firebase configuration values (not the placeholder values)

### Issue: "Email verification not working"

**Solution**: 
1. Check that Email/Password provider is enabled in Firebase Console
2. Check spam folder for verification email
3. Verify Firebase email templates are configured correctly

### Issue: "OAuth not working"

**Solution**:
1. For Google: Configure OAuth 2.0 credentials in Google Cloud Console
2. For Apple: Configure Sign in with Apple in Apple Developer Portal
3. Add authorized domains in Firebase Console
4. See `FIREBASE_SETUP.md` for detailed OAuth setup instructions

### Issue: "Session not persisting"

**Solution**:
1. Check that Firebase persistence is configured correctly in `lib/firebase.ts`
2. For native: Ensure `@react-native-async-storage/async-storage` is installed
3. For web: Check browser cookies are enabled

### Issue: "Redirect loop after sign-in"

**Solution**:
1. Check that `onAuthStateChanged` listener is working in `AuthContext.tsx`
2. Verify `_layout.tsx` auth flow logic is correct
3. Check that profile exists check is working in onboarding

## 📊 Backend Integration Verification

The backend now uses Firebase Authentication instead of Better Auth. Here's what to verify:

### 1. Token Verification

All authenticated API calls now send Firebase ID tokens:

```typescript
Authorization: Bearer <firebase-id-token>
```

**Test**: Make an authenticated API call (e.g., get user profile) and check the network tab to verify the Authorization header is present.

### 2. Protected Endpoints

All protected endpoints should verify Firebase tokens. Test these endpoints:

- ✅ `GET /api/users/me` - Get current user profile
- ✅ `PUT /api/users/me` - Update user profile
- ✅ `POST /api/onboarding/complete` - Complete onboarding
- ✅ `GET /api/feed` - Get feed posts
- ✅ `POST /api/posts` - Create a post

**Expected Behavior**: All requests should include Firebase ID token and be accepted by the backend.

### 3. Error Handling

Test error scenarios:

- ✅ 401 Unauthorized - Invalid or expired token
- ✅ 403 Forbidden - Insufficient permissions
- ✅ 500 Server Error - Backend error

**Expected Behavior**: Error messages are displayed in modals, not Alert.alert()

## ✅ Success Criteria

Your Firebase authentication integration is successful if:

1. ✅ Can sign up with email/password
2. ✅ Email verification works
3. ✅ Can sign in with email/password
4. ✅ Password reset works
5. ✅ Session persists after app reload
6. ✅ Can sign out successfully
7. ✅ Onboarding flow works
8. ✅ Protected API endpoints work with Firebase tokens
9. ✅ Error handling works (no Alert.alert() crashes on web)
10. ✅ OAuth works on web (Google/Apple)

## 🎉 Next Steps

After successful testing:

1. **Configure OAuth for Native**:
   - Set up Google Sign-In for iOS/Android
   - Set up Apple Sign-In for iOS
   - See `FIREBASE_SETUP.md` for instructions

2. **Add Additional Features**:
   - Email verification reminders
   - Password strength indicator
   - Social profile linking
   - Multi-factor authentication

3. **Production Deployment**:
   - Update Firebase configuration for production
   - Configure production OAuth credentials
   - Set up Firebase App Check for security
   - Enable Firebase Analytics

## 📚 Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Firebase Setup](https://docs.expo.dev/guides/using-firebase/)
- `FIREBASE_SETUP.md` - Detailed Firebase setup guide
- `MIGRATION_SUMMARY.md` - Migration from Better Auth to Firebase

## 🆘 Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify Firebase configuration in `app.json`
3. Check Firebase Console for authentication logs
4. Review `FIREBASE_SETUP.md` for setup instructions
5. Check backend logs for API errors

---

**Happy Testing! 🚀**
