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

      const { filter, location, archived } = request.query as {
        filter?: 'friends' | 'put_me_on' | 'anyone';
        location?: 'nearby' | 'anywhere';
        archived?: string;
      };

      app.logger.info(
        { userId: session.user.id, filter: filter || 'anyone', archived: archived === 'true' },
        'Fetching conversations'
      );

      try {
        // Get all messages for this user
        const allMessages = await app.db.query.messages.findMany({
          where: or(
            eq(schema.messages.senderId, session.user.id),
            eq(schema.messages.receiverId, session.user.id)
          ),
        });

        // Filter by archived status
        const filteredMessages = allMessages.filter(
          (m) => (archived === 'true' ? m.archived : !m.archived)
        );

        // Extract unique user IDs
        const userIds = new Set<string>();
        filteredMessages.forEach((msg) => {
          if (msg.senderId !== session.user.id) userIds.add(msg.senderId);
          if (msg.receiverId !== session.user.id) userIds.add(msg.receiverId);
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
              (m.senderId === session.user.id && m.receiverId === userId) ||
              (m.senderId === userId && m.receiverId === session.user.id)
          );

          const lastMsg = userMsgs.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          const unreadCount = userMsgs.filter(
            (m) => m.receiverId === session.user.id && !m.read
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
            archived: lastMsg?.archived || false,
            muted: lastMsg?.muted || false,
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
   * Get archived conversations
   */
  app.fastify.get(
    '/api/messages/archived',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching archived conversations');

      try {
        const archivedMessages = await app.db.query.messages.findMany({
          where: and(
            or(
              eq(schema.messages.senderId, session.user.id),
              eq(schema.messages.receiverId, session.user.id)
            ),
            eq(schema.messages.archived, true)
          ),
        });

        const userIds = new Set<string>();
        archivedMessages.forEach((msg) => {
          if (msg.senderId !== session.user.id) userIds.add(msg.senderId);
          if (msg.receiverId !== session.user.id) userIds.add(msg.receiverId);
        });

        const profiles = await app.db.query.userProfiles.findMany();
        const profileMap = new Map<string, (typeof profiles)[number]>(
          profiles.map((p) => [p.id as string, p] as const)
        );

        const conversations = Array.from(userIds).map((userId) => {
          const lastMsg = archivedMessages
            .filter(
              (m) =>
                (m.senderId === session.user.id && m.receiverId === userId) ||
                (m.senderId === userId && m.receiverId === session.user.id)
            )
            .sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

          const profile = profileMap.get(userId);

          return {
            userId,
            username: profile?.username,
            fullName: profile?.fullName,
            avatarUrl: profile?.avatarUrl,
            lastMessage: lastMsg?.content,
            lastMessageTime: lastMsg?.createdAt,
          };
        });

        app.logger.info(
          { userId: session.user.id, count: conversations.length },
          'Archived conversations retrieved'
        );
        return conversations;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch archived conversations'
        );
        throw error;
      }
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
          .set({ read: true })
          .where(
            and(
              eq(schema.messages.receiverId, session.user.id),
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
          .set({ read: false })
          .where(
            and(
              eq(schema.messages.receiverId, session.user.id),
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
   * Archive a conversation
   */
  app.fastify.put(
    '/api/messages/:userId/archive',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Archiving conversation');

      try {
        await app.db
          .update(schema.messages)
          .set({ archived: true })
          .where(
            or(
              and(
                eq(schema.messages.senderId, session.user.id),
                eq(schema.messages.receiverId, userId)
              ),
              and(
                eq(schema.messages.senderId, userId),
                eq(schema.messages.receiverId, session.user.id)
              )
            )
          );

        app.logger.info({ currentUserId: session.user.id, userId }, 'Conversation archived');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to archive conversation'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/messages/:userId/unarchive
   * Unarchive a conversation
   */
  app.fastify.put(
    '/api/messages/:userId/unarchive',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Unarchiving conversation');

      try {
        await app.db
          .update(schema.messages)
          .set({ archived: false })
          .where(
            or(
              and(
                eq(schema.messages.senderId, session.user.id),
                eq(schema.messages.receiverId, userId)
              ),
              and(
                eq(schema.messages.senderId, userId),
                eq(schema.messages.receiverId, session.user.id)
              )
            )
          );

        app.logger.info({ currentUserId: session.user.id, userId }, 'Conversation unarchived');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to unarchive conversation'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/messages/:userId/mute
   * Mute a conversation
   */
  app.fastify.put(
    '/api/messages/:userId/mute',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Muting conversation');

      try {
        await app.db
          .update(schema.messages)
          .set({ muted: true })
          .where(
            or(
              and(
                eq(schema.messages.senderId, session.user.id),
                eq(schema.messages.receiverId, userId)
              ),
              and(
                eq(schema.messages.senderId, userId),
                eq(schema.messages.receiverId, session.user.id)
              )
            )
          );

        app.logger.info({ currentUserId: session.user.id, userId }, 'Conversation muted');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to mute conversation'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/messages/:userId/unmute
   * Unmute a conversation
   */
  app.fastify.put(
    '/api/messages/:userId/unmute',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Unmuting conversation');

      try {
        await app.db
          .update(schema.messages)
          .set({ muted: false })
          .where(
            or(
              and(
                eq(schema.messages.senderId, session.user.id),
                eq(schema.messages.receiverId, userId)
              ),
              and(
                eq(schema.messages.senderId, userId),
                eq(schema.messages.receiverId, session.user.id)
              )
            )
          );

        app.logger.info({ currentUserId: session.user.id, userId }, 'Conversation unmuted');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to unmute conversation'
        );
        throw error;
      }
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
              eq(schema.messages.receiverId, userId)
            ),
            and(
              eq(schema.messages.senderId, userId),
              eq(schema.messages.receiverId, session.user.id)
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
