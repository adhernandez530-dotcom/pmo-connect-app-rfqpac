/**
 * Privacy Settings Routes
 * Manage user privacy preferences
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

// Default privacy settings
const DEFAULT_PRIVACY_SETTINGS = {
  isProfilePublic: true,
  allowDirectMessages: true,
  allowFriendRequests: true,
};

export function registerPrivacySettingsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/settings/privacy
   * Get user's privacy settings
   */
  app.fastify.get(
    '/api/settings/privacy',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching privacy settings');

      try {
        // Try to find existing settings
        let settings = await app.db.query.userPrivacySettings.findFirst({
          where: eq(schema.userPrivacySettings.userId, session.user.id),
        });

        // If no settings exist, create default settings
        if (!settings) {
          app.logger.info(
            { userId: session.user.id },
            'Creating default privacy settings for user'
          );

          const created = await app.db
            .insert(schema.userPrivacySettings)
            .values({
              userId: session.user.id,
              isProfilePublic: DEFAULT_PRIVACY_SETTINGS.isProfilePublic,
              allowDirectMessages: DEFAULT_PRIVACY_SETTINGS.allowDirectMessages,
              allowFriendRequests: DEFAULT_PRIVACY_SETTINGS.allowFriendRequests,
            })
            .returning();

          settings = created[0];
        }

        app.logger.info({ userId: session.user.id }, 'Privacy settings retrieved');

        return {
          isProfilePublic: settings.isProfilePublic,
          allowDirectMessages: settings.allowDirectMessages,
          allowFriendRequests: settings.allowFriendRequests,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch privacy settings'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/settings/privacy
   * Update user's privacy settings
   */
  app.fastify.put(
    '/api/settings/privacy',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const {
        isProfilePublic,
        allowDirectMessages,
        allowFriendRequests,
      } = request.body as {
        isProfilePublic?: boolean;
        allowDirectMessages?: boolean;
        allowFriendRequests?: boolean;
      };

      app.logger.info({ userId: session.user.id }, 'Updating privacy settings');

      try {
        // Get or create existing settings
        const existing = await app.db.query.userPrivacySettings.findFirst({
          where: eq(schema.userPrivacySettings.userId, session.user.id),
        });

        if (!existing) {
          app.logger.warn({ userId: session.user.id }, 'Privacy settings not found');
          return reply.status(404).send({ error: 'Privacy settings not found' });
        }

        // Update privacy settings
        const updated = await app.db
          .update(schema.userPrivacySettings)
          .set({
            isProfilePublic: isProfilePublic !== undefined ? isProfilePublic : existing.isProfilePublic,
            allowDirectMessages: allowDirectMessages !== undefined ? allowDirectMessages : existing.allowDirectMessages,
            allowFriendRequests: allowFriendRequests !== undefined ? allowFriendRequests : existing.allowFriendRequests,
            updatedAt: new Date(),
          })
          .where(eq(schema.userPrivacySettings.userId, session.user.id))
          .returning();

        app.logger.info({ userId: session.user.id }, 'Privacy settings updated');

        return {
          isProfilePublic: updated[0].isProfilePublic,
          allowDirectMessages: updated[0].allowDirectMessages,
          allowFriendRequests: updated[0].allowFriendRequests,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to update privacy settings'
        );
        throw error;
      }
    }
  );
}
