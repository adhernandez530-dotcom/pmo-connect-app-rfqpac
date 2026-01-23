/**
 * Friendships Routes
 * Manage friend requests and connections
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, inArray } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerFriendsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/friends
   * Get all accepted friends
   */
  app.fastify.get('/api/friends', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching friends list');

    try {
      const friendships = await app.db.query.friendships.findMany({
        where: and(
          eq(schema.friendships.status, 'accepted'),
          or(
            eq(schema.friendships.userId, session.user.id),
            eq(schema.friendships.friendId, session.user.id)
          )
        ),
      });

      const friendIds = friendships.map((f) =>
        f.userId === session.user.id ? f.friendId : f.userId
      );

      if (friendIds.length === 0) {
        app.logger.info({ userId: session.user.id }, 'No friends found');
        return [];
      }

      const friends = await app.db
        .select({
          id: schema.userProfiles.id,
          username: schema.userProfiles.username,
          fullName: schema.userProfiles.fullName,
          avatarUrl: schema.userProfiles.avatarUrl,
          location: schema.userProfiles.location,
        })
        .from(schema.userProfiles)
        .where(inArray(schema.userProfiles.id, friendIds));

      app.logger.info({ userId: session.user.id, friendCount: friends.length }, 'Friends retrieved');
      return friends;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch friends');
      throw error;
    }
  });

  /**
   * GET /api/friends/requests
   * Get pending friend requests (incoming)
   */
  app.fastify.get(
    '/api/friends/requests',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching friend requests');

      try {
        const pendingRequests = await app.db
          .select({
            id: schema.friendships.id,
            userId: schema.friendships.userId,
            username: schema.userProfiles.username,
            fullName: schema.userProfiles.fullName,
            avatarUrl: schema.userProfiles.avatarUrl,
            createdAt: schema.friendships.createdAt,
          })
          .from(schema.friendships)
          .leftJoin(
            schema.userProfiles,
            eq(schema.friendships.userId, schema.userProfiles.id)
          )
          .where(
            and(
              eq(schema.friendships.friendId, session.user.id),
              eq(schema.friendships.status, 'pending')
            )
          );

        app.logger.info(
          { userId: session.user.id, requestCount: pendingRequests.length },
          'Friend requests retrieved'
        );
        return pendingRequests;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch friend requests'
        );
        throw error;
      }
    }
  );

  /**
   * GET /api/friends/status/:userId
   * Get friendship status between current user and specified user
   */
  app.fastify.get(
    '/api/friends/status/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info(
        { currentUserId: session.user.id, userId },
        'Fetching friendship status'
      );

      try {
        if (userId === session.user.id) {
          app.logger.warn({ userId: session.user.id }, 'Cannot check friendship with self');
          return reply
            .status(400)
            .send({ error: 'Cannot check friendship status with yourself' });
        }

        // Check if target user exists
        const targetUser = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, userId),
        });

        if (!targetUser) {
          app.logger.warn({ userId }, 'Target user not found');
          return reply.status(404).send({ error: 'User not found' });
        }

        // Look for existing friendship in either direction
        const friendship = await app.db.query.friendships.findFirst({
          where: or(
            and(
              eq(schema.friendships.userId, session.user.id),
              eq(schema.friendships.friendId, userId)
            ),
            and(
              eq(schema.friendships.userId, userId),
              eq(schema.friendships.friendId, session.user.id)
            )
          ),
        });

        let status = 'none';

        if (friendship) {
          if (friendship.status === 'accepted') {
            status = 'friends';
          } else if (friendship.status === 'pending') {
            // Determine if it's a sent or received request
            status =
              friendship.userId === session.user.id
                ? 'pending_sent'
                : 'pending_received';
          }
        }

        app.logger.info(
          { currentUserId: session.user.id, userId, status },
          'Friendship status retrieved'
        );
        return { status };
      } catch (error) {
        app.logger.error(
          { err: error, currentUserId: session.user.id, userId },
          'Failed to fetch friendship status'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/friends/request
   * Send a friend request
   */
  app.fastify.post(
    '/api/friends/request',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { friendId } = request.body as { friendId: string };

      app.logger.info(
        { userId: session.user.id, friendId },
        'Sending friend request'
      );

      try {
        if (friendId === session.user.id) {
          app.logger.warn({ userId: session.user.id }, 'Cannot send friend request to self');
          return reply.status(400).send({ error: 'Cannot send friend request to yourself' });
        }

        // Check if target user exists
        const targetUser = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, friendId),
        });

        if (!targetUser) {
          app.logger.warn({ friendId }, 'Target user not found');
          return reply.status(404).send({ error: 'User not found' });
        }

        // Check for existing friendship
        const existing = await app.db.query.friendships.findFirst({
          where: or(
            and(
              eq(schema.friendships.userId, session.user.id),
              eq(schema.friendships.friendId, friendId)
            ),
            and(
              eq(schema.friendships.userId, friendId),
              eq(schema.friendships.friendId, session.user.id)
            )
          ),
        });

        if (existing) {
          app.logger.warn(
            { userId: session.user.id, friendId },
            'Friendship already exists'
          );
          return reply
            .status(400)
            .send({ error: 'Friendship request already exists' });
        }

        const friendship = await app.db
          .insert(schema.friendships)
          .values({
            userId: session.user.id,
            friendId,
            status: 'pending',
          })
          .returning();

        app.logger.info(
          { userId: session.user.id, friendId, friendshipId: friendship[0].id },
          'Friend request sent successfully'
        );
        return friendship[0];
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, friendId },
          'Failed to send friend request'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/friends/:friendshipId/accept
   * Accept a friend request
   */
  app.fastify.put(
    '/api/friends/:friendshipId/accept',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { friendshipId } = request.params as { friendshipId: string };

      app.logger.info(
        { userId: session.user.id, friendshipId },
        'Accepting friend request'
      );

      try {
        const friendship = await app.db.query.friendships.findFirst({
          where: eq(schema.friendships.id, friendshipId),
        });

        if (!friendship) {
          app.logger.warn({ friendshipId }, 'Friendship not found');
          return reply.status(404).send({ error: 'Friendship not found' });
        }

        if (friendship.friendId !== session.user.id) {
          app.logger.warn(
            { userId: session.user.id, friendshipId },
            'Unauthorized to accept this request'
          );
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        const updated = await app.db
          .update(schema.friendships)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(schema.friendships.id, friendshipId))
          .returning();

        app.logger.info({ userId: session.user.id, friendshipId }, 'Friend request accepted');
        return updated[0];
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, friendshipId },
          'Failed to accept friend request'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/friends/:friendshipId/reject
   * Reject a friend request
   */
  app.fastify.put(
    '/api/friends/:friendshipId/reject',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { friendshipId } = request.params as { friendshipId: string };

      app.logger.info(
        { userId: session.user.id, friendshipId },
        'Rejecting friend request'
      );

      try {
        const friendship = await app.db.query.friendships.findFirst({
          where: eq(schema.friendships.id, friendshipId),
        });

        if (!friendship) {
          app.logger.warn({ friendshipId }, 'Friendship not found');
          return reply.status(404).send({ error: 'Friendship not found' });
        }

        if (friendship.friendId !== session.user.id) {
          app.logger.warn(
            { userId: session.user.id, friendshipId },
            'Unauthorized to reject this request'
          );
          return reply.status(403).send({ error: 'Unauthorized' });
        }

        await app.db.delete(schema.friendships).where(eq(schema.friendships.id, friendshipId));

        app.logger.info({ userId: session.user.id, friendshipId }, 'Friend request rejected');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, friendshipId },
          'Failed to reject friend request'
        );
        throw error;
      }
    }
  );

  /**
   * DELETE /api/friends/:friendId
   * Remove a friend
   */
  app.fastify.delete(
    '/api/friends/:friendId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { friendId } = request.params as { friendId: string };

      app.logger.info({ userId: session.user.id, friendId }, 'Removing friend');

      try {
        const friendship = await app.db.query.friendships.findFirst({
          where: or(
            and(
              eq(schema.friendships.userId, session.user.id),
              eq(schema.friendships.friendId, friendId)
            ),
            and(
              eq(schema.friendships.userId, friendId),
              eq(schema.friendships.friendId, session.user.id)
            )
          ),
        });

        if (!friendship) {
          app.logger.warn({ userId: session.user.id, friendId }, 'Friendship not found');
          return reply.status(404).send({ error: 'Friendship not found' });
        }

        await app.db.delete(schema.friendships).where(eq(schema.friendships.id, friendship.id));

        app.logger.info({ userId: session.user.id, friendId }, 'Friend removed successfully');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, friendId },
          'Failed to remove friend'
        );
        throw error;
      }
    }
  );
}
