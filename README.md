# PMO Connect

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

Made with 💙 for creativity.

## Backend Integration Status

✅ **Authentication Fixed** - The backend authentication middleware has been updated to properly validate Better Auth session cookies.

### What Changed (Backend)
- Fixed authentication middleware to properly extract and validate Better Auth session cookies
- Session tokens are now correctly validated against the database
- User ID is properly attached to authenticated requests
- All protected endpoints now work correctly with session-based authentication

### Frontend Integration
The frontend was already correctly configured and required minimal optimization:

1. **API Layer** (`utils/api.ts`)
   - All API calls use `credentials: "include"` to send session cookies
   - Authenticated helpers (`authenticatedGet`, `authenticatedPost`, etc.) properly handle session management
   - Error handling for 401/403 responses

2. **Authentication Flow** (`contexts/AuthContext.tsx`)
   - Better Auth integration with email/password and OAuth (Google, Apple)
   - Session persistence across app restarts
   - Proper error handling and user feedback

3. **Routing** (`app/_layout.tsx`)
   - Optimized session check and profile verification flow
   - Reduced retry logic now that backend properly validates cookies
   - Proper redirect handling for unauthenticated users

### Testing the Authentication

To test the authentication flow:

1. **Sign Up**
   ```
   - Open the app
   - Tap "Sign Up"
   - Enter email, password, and name
   - Complete email verification
   - Complete onboarding
   ```

2. **Sign In**
   ```
   - Open the app
   - Tap "Sign In"
   - Enter email and password
   - App should remember your session on reload
   ```

3. **Protected Endpoints**
   All these endpoints now work correctly with session cookies:
   - `/api/users/me` - Get current user profile
   - `/api/init/profile-exists` - Check if profile exists
   - `/api/profile/*` - Profile management
   - `/api/posts/*` - Post management
   - `/api/messages/*` - Messaging
   - `/api/friends/*` - Friend management
   - And all other protected endpoints

### Sample Test User
You can create a test user with these credentials:
- **Email**: test@example.com
- **Password**: test123456
- **Name**: Test User

After signing up, complete the onboarding flow to access the full app.

### Troubleshooting

If you encounter authentication issues:

1. **Clear app data** - Sign out and sign in again
2. **Check console logs** - Look for `[API]` and `AuthContext:` logs
3. **Verify backend URL** - Check `app.json` has the correct `backendUrl`
4. **Session cookies** - Ensure cookies are enabled in your browser (for web)

### Technical Details

**Session Management:**
- Sessions are stored as HTTP-only cookies by Better Auth
- Frontend sends cookies automatically with `credentials: "include"`
- Backend validates cookies on each protected endpoint request
- Session tokens are validated against the database

**Cross-Platform Support:**
- **Web**: Uses localStorage for session storage, cookies for API requests
- **iOS/Android**: Uses SecureStore for session storage, cookies for API requests
- **OAuth**: Supports web popup flow and native deep linking
