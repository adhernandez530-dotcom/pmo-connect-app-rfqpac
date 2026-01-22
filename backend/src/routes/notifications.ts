/**
 * Notifications Routes
 * Manage user notifications
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerNotificationsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/notifications
   * Get user notifications
   */
  app.fastify.get(
    '/api/notifications',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching notifications');

      try {
        const notificationsData = await app.db
          .select({
            id: schema.notifications.id,
            type: schema.notifications.type,
            content: schema.notifications.content,
            read: schema.notifications.read,
            relatedUserId: schema.notifications.relatedUserId,
            relatedUsername: schema.userProfiles.username,
            createdAt: schema.notifications.createdAt,
          })
          .from(schema.notifications)
          .leftJoin(
            schema.userProfiles,
            eq(schema.notifications.relatedUserId, schema.userProfiles.id)
          )
          .where(eq(schema.notifications.userId, session.user.id))
          .orderBy(desc(schema.notifications.createdAt));

        app.logger.info(
          { userId: session.user.id, notificationCount: notificationsData.length },
          'Notifications retrieved'
        );
        return notificationsData;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch notifications'
        );
        throw error;
      }
    }
  );

}
