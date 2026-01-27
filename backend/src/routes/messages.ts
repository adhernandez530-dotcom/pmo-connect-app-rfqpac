/**
 * Messages Routes
 * Direct messaging between users
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, desc, max } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerMessagesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/messages/:userId
   * Get messages with specific user
   */
  app.fastify.get(
    '/api/messages/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Fetching messages with user');

      try {
        const messages = await app.db.query.messages.findMany({
          where: or(
            and(
              eq(schema.messages.senderId, session.user.id),
              eq(schema.messages.recipientId, userId)
            ),
            and(
              eq(schema.messages.senderId, userId),
              eq(schema.messages.recipientId, session.user.id)
            )
          ),
        });

        app.logger.info(
          { currentUserId: session.user.id, userId, messageCount: messages.length },
          'Messages retrieved'
        );
        return messages;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, targetUserId: userId },
          'Failed to fetch messages'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/messages
   * Send a message
   */
  app.fastify.post('/api/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { recipientId, content } = request.body as {
      recipientId: string;
      content: string;
    };

    app.logger.info(
      { senderId: session.user.id, recipientId },
      'Sending message'
    );

    try {
      if (!content || content.trim().length === 0) {
        app.logger.warn({ senderId: session.user.id }, 'Empty message content');
        return reply.status(400).send({ error: 'Message content is required' });
      }

      if (recipientId === session.user.id) {
        app.logger.warn({ senderId: session.user.id }, 'Cannot send message to self');
        return reply.status(400).send({ error: 'Cannot send message to yourself' });
      }

      // Check if receiver exists
      const receiver = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.id, recipientId),
      });

      if (!receiver) {
        app.logger.warn({ recipientId }, 'Receiver not found');
        return reply.status(404).send({ error: 'User not found' });
      }

      const message = await app.db
        .insert(schema.messages)
        .values({
          senderId: session.user.id,
          recipientId,
          content,
        })
        .returning();

      app.logger.info(
        { senderId: session.user.id, recipientId, messageId: message[0].id },
        'Message sent successfully'
      );
      return message[0];
    } catch (error) {
      app.logger.error(
        { err: error, senderId: session.user.id, recipientId, content },
        'Failed to send message'
      );
      throw error;
    }
  });

}
