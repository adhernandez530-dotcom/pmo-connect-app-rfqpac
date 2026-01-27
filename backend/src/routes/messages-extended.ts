/**
 * Extended Messages Routes
 * Conversation management with archiving and muting
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerMessagesExtendedRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/messages/conversations?filter=friends|put_me_on|anyone&location=nearby|anywhere
   * Get conversations with filtering
   */
  app.fastify.get(
    '/api/messages/conversations',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { filter, location } = request.query as {
        filter?: 'friends' | 'put_me_on' | 'anyone';
        location?: 'nearby' | 'anywhere';
      };

      app.logger.info(
        { userId: session.user.id, filter: filter || 'anyone' },
        'Fetching conversations'
      );

      try {
        // Get all messages for this user
        const allMessages = await app.db.query.messages.findMany({
          where: or(
            eq(schema.messages.senderId, session.user.id),
            eq(schema.messages.recipientId, session.user.id)
          ),
        });

        const filteredMessages = allMessages;

        // Extract unique user IDs
        const userIds = new Set<string>();
        filteredMessages.forEach((msg) => {
          if (msg.senderId !== session.user.id) userIds.add(msg.senderId);
          if (msg.recipientId !== session.user.id) userIds.add(msg.recipientId);
        });

        if (userIds.size === 0) {
          app.logger.info({ userId: session.user.id }, 'No conversations found');
          return [];
        }

        // Get user profiles
        const profiles = await app.db.query.userProfiles.findMany();
        const profileMap = new Map<string, (typeof profiles)[number]>(
          profiles.map((p) => [p.id as string, p] as const)
        );

        // Apply filters
        let userIdsArray = Array.from(userIds);

        if (filter === 'friends') {
          // Get only friends
          const friendships = await app.db.query.friendships.findMany({
            where: and(
              eq(schema.friendships.status, 'accepted'),
              or(
                eq(schema.friendships.userId, session.user.id),
                eq(schema.friendships.friendId, session.user.id)
              )
            ),
          });

          const friendIds = new Set(
            friendships.map((f) =>
              f.userId === session.user.id ? f.friendId : f.userId
            )
          );

          userIdsArray = userIdsArray.filter((id) => friendIds.has(id));
        }

        // Build conversations
        const conversations = userIdsArray.map((userId) => {
          const userMsgs = filteredMessages.filter(
            (m) =>
              (m.senderId === session.user.id && m.recipientId === userId) ||
              (m.senderId === userId && m.recipientId === session.user.id)
          );

          const lastMsg = userMsgs.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          const unreadCount = userMsgs.filter(
            (m) => m.recipientId === session.user.id && !m.isRead
          ).length;

          const profile = profileMap.get(userId);

          // Get mutual friends count
          const mutualFriendships = [];

          return {
            userId,
            username: profile?.username,
            fullName: profile?.fullName,
            avatarUrl: profile?.avatarUrl,
            lastMessage: lastMsg?.content,
            lastMessageTime: lastMsg?.createdAt,
            unread: unreadCount,
            mutualFriends: 0, // Would be computed from friendship data
          };
        });

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
   * GET /api/messages/archived
   * Get archived conversations (not supported - returns empty)
   */
  app.fastify.get(
    '/api/messages/archived',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching archived conversations');
      return [];
    }
  );

  /**
   * PUT /api/messages/:userId/read
   * Mark all messages from user as read
   */
  app.fastify.put(
    '/api/messages/:userId/read',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Marking messages as read');

      try {
        await app.db
          .update(schema.messages)
          .set({ isRead: true })
          .where(
            and(
              eq(schema.messages.recipientId, session.user.id),
              eq(schema.messages.senderId, userId)
            )
          );

        app.logger.info({ currentUserId: session.user.id, userId }, 'Messages marked as read');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to mark as read'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/messages/:userId/unread
   * Mark all messages from user as unread
   */
  app.fastify.put(
    '/api/messages/:userId/unread',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Marking messages as unread');

      try {
        await app.db
          .update(schema.messages)
          .set({ isRead: false })
          .where(
            and(
              eq(schema.messages.recipientId, session.user.id),
              eq(schema.messages.senderId, userId)
            )
          );

        app.logger.info({ currentUserId: session.user.id, userId }, 'Messages marked as unread');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to mark as unread'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/messages/:userId/archive
   * Archive a conversation (not supported)
   */
  app.fastify.put(
    '/api/messages/:userId/archive',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };
      app.logger.info({ currentUserId: session.user.id, userId }, 'Archive request received (not supported)');
      return { success: true, message: 'Feature not supported' };
    }
  );

  /**
   * PUT /api/messages/:userId/unarchive
   * Unarchive a conversation (not supported)
   */
  app.fastify.put(
    '/api/messages/:userId/unarchive',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };
      app.logger.info({ currentUserId: session.user.id, userId }, 'Unarchive request received (not supported)');
      return { success: true, message: 'Feature not supported' };
    }
  );

  /**
   * PUT /api/messages/:userId/mute
   * Mute a conversation (not supported)
   */
  app.fastify.put(
    '/api/messages/:userId/mute',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };
      app.logger.info({ currentUserId: session.user.id, userId }, 'Mute request received (not supported)');
      return { success: true, message: 'Feature not supported' };
    }
  );

  /**
   * PUT /api/messages/:userId/unmute
   * Unmute a conversation (not supported)
   */
  app.fastify.put(
    '/api/messages/:userId/unmute',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };
      app.logger.info({ currentUserId: session.user.id, userId }, 'Unmute request received (not supported)');
      return { success: true, message: 'Feature not supported' };
    }
  );

  /**
   * DELETE /api/messages/:userId
   * Delete all messages with a user
   */
  app.fastify.delete(
    '/api/messages/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Deleting conversation');

      try {
        await app.db.delete(schema.messages).where(
          or(
            and(
              eq(schema.messages.senderId, session.user.id),
              eq(schema.messages.recipientId, userId)
            ),
            and(
              eq(schema.messages.senderId, userId),
              eq(schema.messages.recipientId, session.user.id)
            )
          )
        );

        app.logger.info({ currentUserId: session.user.id, userId }, 'Conversation deleted');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to delete conversation'
        );
        throw error;
      }
    }
  );
}
