/**
 * Extended Notifications Routes
 * Detailed notifications with user information
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerNotificationsExtendedRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/notifications/detailed
   * Get detailed notifications with user information
   */
  app.fastify.get(
    '/api/notifications/detailed',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching detailed notifications');

      try {
        const notificationsData = await app.db
          .select({
            id: schema.notifications.id,
            type: schema.notifications.type,
            content: schema.notifications.content,
            read: schema.notifications.read,
            relatedUserId: schema.notifications.relatedUserId,
            relatedUsername: schema.userProfiles.username,
            relatedUserFullName: schema.userProfiles.fullName,
            relatedUserAvatar: schema.userProfiles.avatarUrl,
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
          { userId: session.user.id, count: notificationsData.length },
          'Detailed notifications retrieved'
        );
        return notificationsData;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch detailed notifications'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/notifications/:id/read
   * Mark a notification as read
   */
  app.fastify.put(
    '/api/notifications/:id/read',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, notificationId: id }, 'Marking notification as read');

      try {
        const notification = await app.db.query.notifications.findFirst({
          where: eq(schema.notifications.id, id),
        });

        if (!notification) {
          app.logger.warn({ notificationId: id }, 'Notification not found');
          return reply.status(404).send({ error: 'Notification not found' });
        }

        if (notification.userId !== session.user.id) {
          app.logger.warn({ userId: session.user.id, notificationId: id }, 'Unauthorized');
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        await app.db
          .update(schema.notifications)
          .set({ read: true })
          .where(eq(schema.notifications.id, id));

        app.logger.info({ userId: session.user.id, notificationId: id }, 'Notification marked as read');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, notificationId: id },
          'Failed to mark notification as read'
        );
        throw error;
      }
    }
  );
}
