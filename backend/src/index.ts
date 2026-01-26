import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

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

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Configure social providers - only include if credentials are available
const socialProviders: any = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
  };
}

// Enable authentication with social providers
const authConfig: any = {};
if (Object.keys(socialProviders).length > 0) {
  authConfig.socialProviders = socialProviders;
}

app.withAuth(authConfig);

// Log authentication configuration
app.logger.info(
  {
    googleConfigured: !!socialProviders.google,
    appleConfigured: !!socialProviders.apple,
  },
  'Authentication configured'
);

// Enable storage
app.withStorage();

// Register routes - IMPORTANT: Always use registration functions to avoid circular dependency issues
// Register auth debug routes first for early diagnostics
registerAuthDebugRoutes(app);
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
