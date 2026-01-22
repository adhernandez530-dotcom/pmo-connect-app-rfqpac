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
   * GET /api/messages/conversations
   * Get all conversations with last message and unread count
   */
  app.fastify.get(
    '/api/messages/conversations',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching conversations');

      try {
        // Get all messages for this user (as sender or receiver)
        const allMessages = await app.db.query.messages.findMany({
          where: or(
            eq(schema.messages.senderId, session.user.id),
            eq(schema.messages.receiverId, session.user.id)
          ),
        });

        // Extract unique user IDs (except current user)
        const userIds = new Set<string>();
        allMessages.forEach((msg) => {
          if (msg.senderId !== session.user.id) userIds.add(msg.senderId);
          if (msg.receiverId !== session.user.id) userIds.add(msg.receiverId);
        });

        const conversations = await Promise.all(
          Array.from(userIds).map(async (userId) => {
            // Get last message
            const lastMsg = allMessages
              .filter(
                (m) =>
                  (m.senderId === session.user.id && m.receiverId === userId) ||
                  (m.senderId === userId && m.receiverId === session.user.id)
              )
              .sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];

            // Get unread count
            const unreadCount = allMessages.filter(
              (m) =>
                m.receiverId === session.user.id && m.senderId === userId && !m.read
            ).length;

            // Get user profile
            const userProfile = await app.db.query.userProfiles.findFirst({
              where: eq(schema.userProfiles.id, userId),
            });

            return {
              userId,
              username: userProfile?.username,
              fullName: userProfile?.fullName,
              avatarUrl: userProfile?.avatarUrl,
              lastMessage: lastMsg?.content,
              unreadCount,
            };
          })
        );

        app.logger.info(
          { userId: session.user.id, conversationCount: conversations.length },
          'Conversations retrieved'
        );
        return conversations;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch conversations'
        );
        throw error;
      }
    }
  );

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
              eq(schema.messages.receiverId, userId)
            ),
            and(
              eq(schema.messages.senderId, userId),
              eq(schema.messages.receiverId, session.user.id)
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

    const { receiverId, content } = request.body as {
      receiverId: string;
      content: string;
    };

    app.logger.info(
      { senderId: session.user.id, receiverId },
      'Sending message'
    );

    try {
      if (!content || content.trim().length === 0) {
        app.logger.warn({ senderId: session.user.id }, 'Empty message content');
        return reply.status(400).send({ error: 'Message content is required' });
      }

      if (receiverId === session.user.id) {
        app.logger.warn({ senderId: session.user.id }, 'Cannot send message to self');
        return reply.status(400).send({ error: 'Cannot send message to yourself' });
      }

      // Check if receiver exists
      const receiver = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.id, receiverId),
      });

      if (!receiver) {
        app.logger.warn({ receiverId }, 'Receiver not found');
        return reply.status(404).send({ error: 'User not found' });
      }

      const message = await app.db
        .insert(schema.messages)
        .values({
          senderId: session.user.id,
          receiverId,
          content,
        })
        .returning();

      app.logger.info(
        { senderId: session.user.id, receiverId, messageId: message[0].id },
        'Message sent successfully'
      );
      return message[0];
    } catch (error) {
      app.logger.error(
        { err: error, senderId: session.user.id, receiverId, content },
        'Failed to send message'
      );
      throw error;
    }
  });

  /**
   * PUT /api/messages/:id/read
   * Mark a message as read
   */
  app.fastify.put(
    '/api/messages/:id/read',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, messageId: id }, 'Marking message as read');

      try {
        const message = await app.db.query.messages.findFirst({
          where: eq(schema.messages.id, id),
        });

        if (!message) {
          app.logger.warn({ messageId: id }, 'Message not found');
          return reply.status(404).send({ error: 'Message not found' });
        }

        if (message.receiverId !== session.user.id) {
          app.logger.warn(
            { userId: session.user.id, messageId: id },
            'Unauthorized to mark this message'
          );
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        await app.db
          .update(schema.messages)
          .set({ read: true })
          .where(eq(schema.messages.id, id));

        app.logger.info({ userId: session.user.id, messageId: id }, 'Message marked as read');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, messageId: id },
          'Failed to mark message as read'
        );
        throw error;
      }
    }
  );
}
