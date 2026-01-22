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
          app.logger.warn(
            { userId: session.user.id, notificationId: id },
            'Unauthorized to mark this notification'
          );
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

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  app.fastify.put(
    '/api/notifications/read-all',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Marking all notifications as read');

      try {
        await app.db
          .update(schema.notifications)
          .set({ read: true })
          .where(eq(schema.notifications.userId, session.user.id));

        app.logger.info({ userId: session.user.id }, 'All notifications marked as read');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to mark all notifications as read'
        );
        throw error;
      }
    }
  );
}
