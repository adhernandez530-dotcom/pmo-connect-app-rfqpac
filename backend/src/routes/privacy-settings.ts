/**
 * Privacy Settings Routes
 * Manage user privacy preferences
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

// Valid values for privacy settings
const VALID_PROFILE_VISIBILITY = ['public', 'private'];
const VALID_MESSAGE_PERMISSION = ['anyone', 'mutual_friends', 'friends_only'];
const VALID_SERVICES_VISIBILITY = ['everyone', 'friends_only', 'only_me'];
const VALID_FRIENDS_LIST_VISIBILITY = ['everyone', 'friends_only', 'only_me'];
const VALID_TAG_PERMISSION = ['anyone', 'friends_only', 'no_one'];
const VALID_COMMENT_PERMISSION = ['anyone', 'friends_only', 'no_one'];

// Default privacy settings
const DEFAULT_PRIVACY_SETTINGS = {
  profileVisibility: 'public',
  messagePermission: 'anyone',
  servicesVisibility: 'everyone',
  friendsListVisibility: 'everyone',
  tagPermission: 'anyone',
  commentPermission: 'anyone',
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
              profileVisibility: DEFAULT_PRIVACY_SETTINGS.profileVisibility,
              messagePermission: DEFAULT_PRIVACY_SETTINGS.messagePermission,
              servicesVisibility: DEFAULT_PRIVACY_SETTINGS.servicesVisibility,
              friendsListVisibility: DEFAULT_PRIVACY_SETTINGS.friendsListVisibility,
              tagPermission: DEFAULT_PRIVACY_SETTINGS.tagPermission,
              commentPermission: DEFAULT_PRIVACY_SETTINGS.commentPermission,
            })
            .returning();

          settings = created[0];
        }

        app.logger.info({ userId: session.user.id }, 'Privacy settings retrieved');

        return {
          profileVisibility: settings.profileVisibility,
          messagePermission: settings.messagePermission,
          servicesVisibility: settings.servicesVisibility,
          friendsListVisibility: settings.friendsListVisibility,
          tagPermission: settings.tagPermission,
          commentPermission: settings.commentPermission,
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
        profileVisibility,
        messagePermission,
        servicesVisibility,
        friendsListVisibility,
        tagPermission,
        commentPermission,
      } = request.body as {
        profileVisibility?: string;
        messagePermission?: string;
        servicesVisibility?: string;
        friendsListVisibility?: string;
        tagPermission?: string;
        commentPermission?: string;
      };

      app.logger.info({ userId: session.user.id }, 'Updating privacy settings');

      try {
        // Validate input values
        if (
          profileVisibility &&
          !VALID_PROFILE_VISIBILITY.includes(profileVisibility)
        ) {
          app.logger.warn(
            { userId: session.user.id, value: profileVisibility },
            'Invalid profileVisibility value'
          );
          return reply.status(400).send({
            error: `Invalid profileVisibility. Must be one of: ${VALID_PROFILE_VISIBILITY.join(', ')}`,
          });
        }

        if (
          messagePermission &&
          !VALID_MESSAGE_PERMISSION.includes(messagePermission)
        ) {
          app.logger.warn(
            { userId: session.user.id, value: messagePermission },
            'Invalid messagePermission value'
          );
          return reply.status(400).send({
            error: `Invalid messagePermission. Must be one of: ${VALID_MESSAGE_PERMISSION.join(', ')}`,
          });
        }

        if (
          servicesVisibility &&
          !VALID_SERVICES_VISIBILITY.includes(servicesVisibility)
        ) {
          app.logger.warn(
            { userId: session.user.id, value: servicesVisibility },
            'Invalid servicesVisibility value'
          );
          return reply.status(400).send({
            error: `Invalid servicesVisibility. Must be one of: ${VALID_SERVICES_VISIBILITY.join(', ')}`,
          });
        }

        if (
          friendsListVisibility &&
          !VALID_FRIENDS_LIST_VISIBILITY.includes(friendsListVisibility)
        ) {
          app.logger.warn(
            { userId: session.user.id, value: friendsListVisibility },
            'Invalid friendsListVisibility value'
          );
          return reply.status(400).send({
            error: `Invalid friendsListVisibility. Must be one of: ${VALID_FRIENDS_LIST_VISIBILITY.join(', ')}`,
          });
        }

        if (tagPermission && !VALID_TAG_PERMISSION.includes(tagPermission)) {
          app.logger.warn(
            { userId: session.user.id, value: tagPermission },
            'Invalid tagPermission value'
          );
          return reply.status(400).send({
            error: `Invalid tagPermission. Must be one of: ${VALID_TAG_PERMISSION.join(', ')}`,
          });
        }

        if (
          commentPermission &&
          !VALID_COMMENT_PERMISSION.includes(commentPermission)
        ) {
          app.logger.warn(
            { userId: session.user.id, value: commentPermission },
            'Invalid commentPermission value'
          );
          return reply.status(400).send({
            error: `Invalid commentPermission. Must be one of: ${VALID_COMMENT_PERMISSION.join(', ')}`,
          });
        }

        // Try to find existing settings
        let settings = await app.db.query.userPrivacySettings.findFirst({
          where: eq(schema.userPrivacySettings.userId, session.user.id),
        });

        // Build update object with only provided values
        const updateData: any = {};
        if (profileVisibility !== undefined)
          updateData.profileVisibility = profileVisibility;
        if (messagePermission !== undefined)
          updateData.messagePermission = messagePermission;
        if (servicesVisibility !== undefined)
          updateData.servicesVisibility = servicesVisibility;
        if (friendsListVisibility !== undefined)
          updateData.friendsListVisibility = friendsListVisibility;
        if (tagPermission !== undefined) updateData.tagPermission = tagPermission;
        if (commentPermission !== undefined)
          updateData.commentPermission = commentPermission;
        updateData.updatedAt = new Date();

        if (!settings) {
          // Create new settings with provided values and defaults for missing ones
          app.logger.info(
            { userId: session.user.id },
            'Creating privacy settings with provided values'
          );

          const created = await app.db
            .insert(schema.userPrivacySettings)
            .values({
              userId: session.user.id,
              profileVisibility:
                profileVisibility || DEFAULT_PRIVACY_SETTINGS.profileVisibility,
              messagePermission:
                messagePermission || DEFAULT_PRIVACY_SETTINGS.messagePermission,
              servicesVisibility:
                servicesVisibility || DEFAULT_PRIVACY_SETTINGS.servicesVisibility,
              friendsListVisibility:
                friendsListVisibility ||
                DEFAULT_PRIVACY_SETTINGS.friendsListVisibility,
              tagPermission:
                tagPermission || DEFAULT_PRIVACY_SETTINGS.tagPermission,
              commentPermission:
                commentPermission || DEFAULT_PRIVACY_SETTINGS.commentPermission,
            })
            .returning();

          settings = created[0];
        } else {
          // Update existing settings
          const updated = await app.db
            .update(schema.userPrivacySettings)
            .set(updateData)
            .where(eq(schema.userPrivacySettings.userId, session.user.id))
            .returning();

          settings = updated[0];
        }

        app.logger.info(
          { userId: session.user.id },
          'Privacy settings updated successfully'
        );

        return {
          success: true,
          settings: {
            profileVisibility: settings.profileVisibility,
            messagePermission: settings.messagePermission,
            servicesVisibility: settings.servicesVisibility,
            friendsListVisibility: settings.friendsListVisibility,
            tagPermission: settings.tagPermission,
            commentPermission: settings.commentPermission,
          },
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
