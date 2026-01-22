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

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

// Register routes - IMPORTANT: Always use registration functions to avoid circular dependency issues
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

await app.run();
app.logger.info('PUT ME ON app running successfully');
