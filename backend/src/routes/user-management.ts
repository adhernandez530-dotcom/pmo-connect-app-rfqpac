/**
 * User Management Routes
 * Blocking, searching, and user interactions
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, like, inArray, ne } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerUserManagementRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/users/:userId/block
   * Block a user
   */
  app.fastify.post(
    '/api/users/:userId/block',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Blocking user');

      try {
        if (userId === session.user.id) {
          app.logger.warn({ userId: session.user.id }, 'Cannot block yourself');
          return reply.status(400).send({ error: 'Cannot block yourself' });
        }

        // Check if target user exists
        const targetUser = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, userId),
        });

        if (!targetUser) {
          app.logger.warn({ userId }, 'User not found');
          return reply.status(404).send({ error: 'User not found' });
        }

        // Check if already blocked
        const existingBlock = await app.db.query.blockedUsers.findFirst({
          where: and(
            eq(schema.blockedUsers.userId, session.user.id),
            eq(schema.blockedUsers.blockedUserId, userId)
          ),
        });

        if (existingBlock) {
          app.logger.warn({ currentUserId: session.user.id, userId }, 'User already blocked');
          return reply.status(400).send({ error: 'User is already blocked' });
        }

        await app.db.insert(schema.blockedUsers).values({
          userId: session.user.id,
          blockedUserId: userId,
        });

        app.logger.info(
          { currentUserId: session.user.id, blockedUserId: userId },
          'User blocked'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, currentUserId: session.user.id, userId },
          'Failed to block user'
        );
        throw error;
      }
    }
  );

  /**
   * DELETE /api/users/:userId/block
   * Unblock a user
   */
  app.fastify.delete(
    '/api/users/:userId/block',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Unblocking user');

      try {
        const blocked = await app.db.query.blockedUsers.findFirst({
          where: and(
            eq(schema.blockedUsers.userId, session.user.id),
            eq(schema.blockedUsers.blockedUserId, userId)
          ),
        });

        if (!blocked) {
          app.logger.warn({ currentUserId: session.user.id, userId }, 'User not blocked');
          return reply.status(404).send({ error: 'User is not blocked' });
        }

        await app.db
          .delete(schema.blockedUsers)
          .where(
            and(
              eq(schema.blockedUsers.userId, session.user.id),
              eq(schema.blockedUsers.blockedUserId, userId)
            )
          );

        app.logger.info(
          { currentUserId: session.user.id, unblockedUserId: userId },
          'User unblocked'
        );
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, currentUserId: session.user.id, userId },
          'Failed to unblock user'
        );
        throw error;
      }
    }
  );

  /**
   * GET /api/users/blocked
   * Get list of blocked users
   */
  app.fastify.get(
    '/api/users/blocked',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching blocked users');

      try {
        const blockedList = await app.db
          .select({
            id: schema.userProfiles.id,
            username: schema.userProfiles.username,
            fullName: schema.userProfiles.fullName,
            avatarUrl: schema.userProfiles.avatarUrl,
          })
          .from(schema.blockedUsers)
          .leftJoin(
            schema.userProfiles,
            eq(schema.blockedUsers.blockedUserId, schema.userProfiles.id)
          )
          .where(eq(schema.blockedUsers.userId, session.user.id));

        app.logger.info(
          { userId: session.user.id, blockedCount: blockedList.length },
          'Blocked users retrieved'
        );
        return blockedList;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch blocked users'
        );
        throw error;
      }
    }
  );

  /**
   * GET /api/users/search
   * Search users by username or full name
   * Query params: ?q=searchTerm
   */
  app.fastify.get(
    '/api/users/search',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { q } = request.query as { q?: string };

      app.logger.info({ userId: session.user.id, query: q }, 'Searching users');

      try {
        if (!q || q.trim().length === 0) {
          app.logger.warn({ userId: session.user.id }, 'Empty search query');
          return reply.status(400).send({ error: 'Search query is required' });
        }

        const searchTerm = `%${q.trim().toLowerCase()}%`;

        // Get list of blocked users to exclude
        const blockedUsers = await app.db.query.blockedUsers.findMany({
          where: eq(schema.blockedUsers.userId, session.user.id),
        });

        const blockedUserIds = blockedUsers.map((b) => b.blockedUserId);

        // Search for users
        const users = await app.db
          .select({
            id: schema.userProfiles.id,
            username: schema.userProfiles.username,
            fullName: schema.userProfiles.fullName,
            avatarUrl: schema.userProfiles.avatarUrl,
          })
          .from(schema.userProfiles)
          .where(
            and(
              or(
                like(schema.userProfiles.username, searchTerm),
                like(schema.userProfiles.fullName, searchTerm)
              ),
              // Exclude current user
              ne(schema.userProfiles.id, session.user.id)
            )
          );

        // Filter out blocked users
        const results = users.filter((u) => !blockedUserIds.includes(u.id));

        app.logger.info(
          { userId: session.user.id, query: q, resultCount: results.length },
          'User search completed'
        );
        return results;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, query: q },
          'Failed to search users'
        );
        throw error;
      }
    }
  );
}
