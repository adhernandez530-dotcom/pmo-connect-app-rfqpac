import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Merge both schemas - framework needs to see auth schema explicitly
const schema = { ...appSchema, ...authSchema };

// Import route registration functions
import { registerInitRoutes } from './routes/init.js';
import { registerUserRoutes } from './routes/users.js';
import { registerSkillRoutes } from './routes/skills.js';
import { registerPostRoutes } from './routes/posts.js';
import { registerFriendsRoutes } from './routes/friends.js';
import { registerMessagesRoutes } from './routes/messages.js';
import { registerSearchRoutes } from './routes/search.js';
import { registerNotificationsRoutes } from './routes/notifications.js';
import { registerOnboardingRoutes } from './routes/onboarding.js';
import { registerProfileRoutes } from './routes/profile.js';
import { registerFeedRoutes } from './routes/feed.js';
import { registerMessagesExtendedRoutes } from './routes/messages-extended.js';
import { registerFriendsExtendedRoutes } from './routes/friends-extended.js';
import { registerNotificationsExtendedRoutes } from './routes/notifications-extended.js';
import { registerAccountRoutes } from './routes/account.js';
import { registerGroupChatRoutes } from './routes/group-chat.js';
import { registerPrivacySettingsRoutes } from './routes/privacy-settings.js';
import { registerUploadRoutes } from './routes/upload.js';
import { registerPostsExtendedRoutes } from './routes/posts-extended.js';
import { registerUserManagementRoutes } from './routes/user-management.js';
import { registerAuthDebugRoutes } from './routes/auth-debug.js';
import { registerOAuthConfigRoutes } from './routes/oauth-config.js';
import { registerAuthEmailRoutes } from './routes/auth-email.js';

// Create application with comprehensive schema (auth + app tables)
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

// Configure social providers with Google, Apple, and GitHub OAuth
// Note: Credentials can be provided via environment variables for custom OAuth
// If not provided, the framework uses a proxy service for social authentication
const googleEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const appleEnabled = !!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET;
const githubEnabled = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

const authConfig: any = {
  // Base URL for callbacks (used by OAuth providers)
  baseURL: process.env.BASE_URL || 'http://localhost:5000',

  // Trusted origins for CORS and session validation
  trustedOrigins: (process.env.TRUSTED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(url => url.trim()),

  // Social provider OAuth credentials
  socialProviders: {
    google: googleEnabled
      ? {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }
      : undefined,
    apple: appleEnabled
      ? {
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        }
      : undefined,
    github: githubEnabled
      ? {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }
      : undefined,
  },
};

// Enable authentication with social providers and configuration
app.withAuth(authConfig);

// Log authentication configuration
app.logger.info(
  {
    baseURL: authConfig.baseURL,
    trustedOrigins: authConfig.trustedOrigins,
    googleConfigured: googleEnabled,
    googleMethod: googleEnabled ? 'custom' : 'proxy',
    appleConfigured: appleEnabled,
    appleMethod: appleEnabled ? 'custom' : 'proxy',
    githubConfigured: githubEnabled,
    githubMethod: githubEnabled ? 'custom' : 'proxy',
    proxyServiceAvailable: true,
    message: 'OAuth providers configured. If credentials are not set, framework uses proxy service.',
  },
  'Authentication configured'
);

// Enable storage
app.withStorage();

// Register routes - IMPORTANT: Always use registration functions to avoid circular dependency issues
// Register auth and OAuth debug routes first for early diagnostics
registerAuthDebugRoutes(app);
registerOAuthConfigRoutes(app);
registerAuthEmailRoutes(app);
registerInitRoutes(app);
registerUserRoutes(app);
registerSkillRoutes(app);
registerOnboardingRoutes(app);
registerProfileRoutes(app);
registerPostRoutes(app);
registerFeedRoutes(app);
registerFriendsRoutes(app);
registerFriendsExtendedRoutes(app);
registerMessagesRoutes(app);
registerMessagesExtendedRoutes(app);
registerSearchRoutes(app);
registerNotificationsRoutes(app);
registerNotificationsExtendedRoutes(app);
registerAccountRoutes(app);
registerGroupChatRoutes(app);
registerPrivacySettingsRoutes(app);
registerUploadRoutes(app);
registerPostsExtendedRoutes(app);
registerUserManagementRoutes(app);

await app.run();
app.logger.info('PUT ME ON app running successfully');
