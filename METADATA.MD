
# PMO Connect - Project Metadata

## Project Overview

**PMO Connect** (Put Me On) is a social networking platform designed to connect people based on services they offer and knowledge they possess. The app facilitates discovery of talent, skills, and expertise through mutual friend connections and random discovery.

## Core Purpose

Link mutual friends with connections who can provide services or knowledge on specific topics. Whether seeking help with a project, showcasing skills, or connecting with like-minded individuals, PMO Connect makes professional and social networking seamless.

## Technical Stack

### Frontend
- **Framework**: React Native 0.81.4 with Expo 54
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **State Management**: React Context API (AuthContext)
- **Styling**: StyleSheet with centralized theme (commonStyles.ts)
- **Animations**: React Native Reanimated 4.1.0

### Backend
- **Runtime**: Node.js with Fastify
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication (Email/Password, Google OAuth, Apple OAuth)
- **API Architecture**: RESTful endpoints

### Key Dependencies
- `expo-router` - File-based navigation
- `firebase` - Authentication services
- `@react-native-async-storage/async-storage` - Local data persistence
- `expo-camera` - Camera functionality
- `expo-image-picker` - Media selection
- `expo-location` - Geolocation services
- `expo-contacts` - Contact integration
- `react-native-gesture-handler` - Gesture interactions
- `react-native-reanimated` - Advanced animations
- `react-native-maps` - Map integration

## App Structure

### Authentication Flow
- **Entry Point**: `app/auth.tsx` - Welcome screen with OAuth and email options
- **Email Signup**: `app/email-signup.tsx` - Registration with validation
- **Email Signin**: `app/email-signin.tsx` - Login flow
- **Password Recovery**: `app/forgot-password.tsx`, `app/reset-password.tsx`
- **Onboarding**: `app/onboarding.tsx` - Multi-step profile setup

### Main Navigation (Tab-Based)

#### 1. Home Tab (`app/(tabs)/(home)/`)
- User profile display
- Services showcase (up to 10)
- Knowledge topics showcase
- Quick actions (Edit Profile, Notifications, Settings)
- Friends count and navigation
- Platform-specific: `index.tsx` (Android/Web), `index.ios.tsx` (iOS native tabs)

#### 2. Feed Tab (`app/(tabs)/feed.tsx`)
- Social feed with posts from connections
- Like, comment, repost functionality
- Media display (images/videos)
- Post reporting and user blocking
- Sort options (Recent, Popular)

#### 3. Friends Tab (`app/(tabs)/friends.tsx`)
- Friends list with mutual connections count
- Friend requests (sent/received)
- Search friends functionality
- Friend management (remove, block)

#### 4. Messages Tab (`app/(tabs)/messages.tsx`)
- Conversation list with swipe actions
- Unread message indicators
- Archive and mute functionality
- Mutual friends display
- Individual chat: `app/chat/[id].tsx` (Stack navigation, no tabs)

#### 5. Search Tab (`app/(tabs)/search.tsx`)
- User discovery by skills, services, knowledge
- Filter options (All, Mutual Friends, Location-based)
- Location filters (Nearby, Same City, Same State, Anywhere)
- Skill-based search

### Additional Screens

#### Profile & Settings
- `app/edit-profile.tsx` - Profile editing with image upload
- `app/settings.tsx` - App settings, account management
- `app/privacy-settings.tsx` - Privacy controls
- `app/notification-settings.tsx` - Notification preferences
- `app/permissions-settings.tsx` - App permissions management
- `app/blocked-users.tsx` - Blocked users list

#### Content Creation
- `app/create-post.tsx` - Post creation with media, location, tags
- `app/drafts.tsx` - Saved post drafts

#### User Interaction
- `app/user/[id].tsx` - User profile view (dynamic route)
- `app/notifications.tsx` - Notification center

#### Legal & Info
- `app/privacy-policy.tsx` - Privacy policy
- `app/terms-of-service.tsx` - Terms of service

## Key Features

### 1. User Profiles
- Username, full name, location, bio
- Avatar upload with image picker
- Up to 10 services offered
- Unlimited knowledge topics
- Friends count and mutual connections

### 2. Social Networking
- Friend requests (send, accept, decline)
- Mutual friend discovery
- Direct messaging (one-on-one and group)
- Post creation with media (photos/videos)
- Like, comment, repost functionality
- User blocking and reporting

### 3. Discovery & Search
- Search by username, skills, services
- Filter by mutual friends
- Location-based filtering (Nearby, City, State)
- Skill/service tag navigation

### 4. Content Management
- Post drafts with auto-save
- Media upload (camera or gallery)
- Location tagging
- User tagging in posts
- Service/knowledge tag selection

### 5. Privacy & Security
- Comprehensive privacy settings
- User blocking
- Content reporting
- Account deactivation with verification
- Permission management (Camera, Location, Contacts, Notifications)

### 6. Notifications
- Friend requests
- New messages
- Post interactions (likes, comments, reposts)
- Unread count badges

## Platform-Specific Implementation

### iOS
- Native tab bar using `expo-router/unstable-native-tabs`
- SF Symbols for icons
- Platform-specific files: `*.ios.tsx`

### Android/Web
- Custom `FloatingTabBar` component
- Material Icons
- Shared implementation in base `*.tsx` files

## Design System

### Colors (from `styles/commonStyles.ts`)
- **Primary**: Brand color for CTAs and highlights
- **Background**: Main app background
- **Text**: Primary text color
- **Gray**: Secondary text and borders
- **Border**: Dividers and outlines
- **Google Blue**: Google OAuth button
- **Error**: Error states and destructive actions

### Components
- `IconSymbol` - Cross-platform icon component
- `ConfirmModal` - Custom modal for confirmations (replaces Alert.alert)
- `Toast` - Toast notifications
- `FloatingTabBar` - Custom tab bar for Android/Web
- `LoadingButton` - Button with loading state
- `Map` - Map component with platform-specific implementations

## API Integration

### Backend URL
Configured in `app.json` under `extra.backendUrl`

### Authentication
- Bearer token authentication
- Token stored in AsyncStorage
- Auto-refresh on app launch
- Secure token transmission

### API Utilities (`utils/api.ts`)
- `apiGet`, `apiPost` - Public endpoints
- `authenticatedGet`, `authenticatedPost`, `authenticatedPut`, `authenticatedDelete` - Protected endpoints
- Automatic token injection
- Error handling and parsing

## Database Schema (Backend)

### Core Tables
- **users** - User profiles and authentication
- **sessions** - Active user sessions
- **services** - User-offered services
- **knowledge** - User knowledge topics
- **posts** - Social media posts
- **comments** - Post comments
- **likes** - Post likes
- **reposts** - Post reposts
- **friendships** - Friend connections
- **friend_requests** - Pending friend requests
- **messages** - Direct messages
- **conversations** - Message threads
- **notifications** - User notifications
- **blocked_users** - User blocking records
- **reports** - Content/user reports
- **drafts** - Saved post drafts

## Configuration Files

### `app.json`
- App metadata (name, slug, version)
- Platform-specific settings (iOS, Android, Web)
- Firebase configuration in `extra` field
- Expo plugins configuration
- Bundle identifiers and schemes

### `package.json`
- Dependencies and versions
- Scripts for development and building
- Project metadata

### `tsconfig.json`
- TypeScript compiler options
- Path aliases (@/ for root imports)

## Development Workflow

### Running the App
```bash
npm run dev      # Start with tunnel
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

### Building
```bash
npm run build:web     # Web production build
npm run build:android # Android prebuild
```

## Security Considerations

### Authentication
- Firebase handles OAuth flows
- Secure token storage with AsyncStorage
- Token validation on backend
- Session management

### Data Protection
- User blocking prevents unwanted interactions
- Content reporting for moderation
- Privacy settings for profile visibility
- Secure API communication (HTTPS)

### Permissions
- Camera - Post creation, profile photos
- Photo Library - Media selection
- Location - Location tagging, nearby search
- Contacts - Friend discovery
- Notifications - Push notifications
- Microphone - Video recording

## Known Limitations

### Platform Differences
- iOS uses native tab bar, Android/Web use custom FloatingTabBar
- Some animations may differ between platforms
- Web has limited native API access (camera, contacts)

### Chat & Camera Screens
- Must use Stack navigation (not tabs)
- FloatingTabBar would block input fields and controls
- Implemented in `app/chat/[id].tsx` and camera screens

## Future Enhancements

### Potential Features
- Group messaging
- Video calls
- Advanced search filters
- Service marketplace
- Rating/review system
- Portfolio showcase
- Event creation and management
- Skill verification
- Premium features with Superwall integration

## File Organization

### `/app` - Application screens and routes
### `/components` - Reusable UI components
### `/contexts` - React Context providers
### `/utils` - Utility functions and API helpers
### `/styles` - Centralized styling and themes
### `/assets` - Images, fonts, and static resources
### `/backend` - Backend API implementation
### `/constants` - App-wide constants

## Documentation Files

- `README.md` - Project setup and overview
- `FIREBASE_SETUP.md` - Firebase configuration guide
- `FIREBASE_AUTH_TESTING_GUIDE.md` - Authentication testing
- `FIREBASE_CHECKLIST.md` - Setup checklist
- `FIREBASE_CONNECTION_GUIDE.md` - Connection troubleshooting
- `QUICK_FIREBASE_SETUP.md` - Quick start guide
- `QUICK_START.md` - App quick start
- `INTEGRATION_COMPLETE.md` - Integration status
- `MIGRATION_SUMMARY.md` - Migration notes
- `METADATA.MD` - This file

## Version Information

- **App Version**: 1.0.0
- **Expo SDK**: 54.0.1
- **React Native**: 0.81.4
- **React**: 19.1.0
- **TypeScript**: 5.9.3

## Contact & Support

For issues, feature requests, or contributions, refer to the project repository and documentation files listed above.

---

**Last Updated**: January 2025
**Project Status**: Active Development
**License**: Private
