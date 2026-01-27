import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema.js';

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

// Configure social providers with Google, Apple, and GitHub OAuth
// Note: Credentials can be provided via environment variables for custom OAuth
// If not provided, the framework uses a proxy service for social authentication
const authConfig: any = {
  socialProviders: {
    google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }
      : undefined,
    apple: process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? {
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        }
      : undefined,
    github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }
      : undefined,
  },
};

// Enable authentication with social providers
app.withAuth(authConfig);

// Log authentication configuration
app.logger.info(
  {
    googleConfigured: !!authConfig.socialProviders.google,
    appleConfigured: !!authConfig.socialProviders.apple,
    githubConfigured: !!authConfig.socialProviders.github,
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
