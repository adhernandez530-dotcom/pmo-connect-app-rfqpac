/**
 * Extended Friends Routes
 * Friend acceptance and contact suggestions
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerFriendsExtendedRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/friends/accept/:userId
   * Accept a friend request
   */
  app.fastify.post(
    '/api/friends/accept/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Accepting friend request');

      try {
        // Find the friendship request
        const friendship = await app.db.query.friendships.findFirst({
          where: and(
            eq(schema.friendships.userId, userId),
            eq(schema.friendships.friendId, session.user.id),
            eq(schema.friendships.status, 'pending')
          ),
        });

        if (!friendship) {
          app.logger.warn({ currentUserId: session.user.id, userId }, 'Friendship not found');
          return reply.status(404).send({ error: 'Friend request not found' });
        }

        // Update to accepted
        const updated = await app.db
          .update(schema.friendships)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(schema.friendships.id, friendship.id))
          .returning();

        app.logger.info({ currentUserId: session.user.id, userId }, 'Friend request accepted');
        return { success: true, friendship: updated[0] };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to accept friend request'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/friends/reject/:userId
   * Reject a friend request
   */
  app.fastify.post(
    '/api/friends/reject/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { userId } = request.params as { userId: string };

      app.logger.info({ currentUserId: session.user.id, userId }, 'Rejecting friend request');

      try {
        // Find the friendship request
        const friendship = await app.db.query.friendships.findFirst({
          where: and(
            eq(schema.friendships.userId, userId),
            eq(schema.friendships.friendId, session.user.id),
            eq(schema.friendships.status, 'pending')
          ),
        });

        if (!friendship) {
          app.logger.warn({ currentUserId: session.user.id, userId }, 'Friendship not found');
          return reply.status(404).send({ error: 'Friend request not found' });
        }

        // Delete the request
        await app.db.delete(schema.friendships).where(eq(schema.friendships.id, friendship.id));

        app.logger.info({ currentUserId: session.user.id, userId }, 'Friend request rejected');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, otherUserId: userId },
          'Failed to reject friend request'
        );
        throw error;
      }
    }
  );

  /**
   * GET /api/contacts/suggestions
   * Get contact suggestions
   */
  app.fastify.get(
    '/api/contacts/suggestions',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching contact suggestions');

      try {
        // Get suggestions from database
        const suggestions = await app.db
          .select({
            id: schema.contactSuggestions.id,
            userId: schema.contactSuggestions.suggestedUserId,
            username: schema.userProfiles.username,
            fullName: schema.userProfiles.fullName,
            avatarUrl: schema.userProfiles.avatarUrl,
            reason: schema.contactSuggestions.reason,
          })
          .from(schema.contactSuggestions)
          .leftJoin(
            schema.userProfiles,
            eq(schema.contactSuggestions.suggestedUserId, schema.userProfiles.id)
          )
          .where(eq(schema.contactSuggestions.userId, session.user.id));

        // Enrich with mutual friends count
        const enrichedSuggestions = await Promise.all(
          suggestions.map(async (suggestion) => {
            const mutualFriendships = await app.db.query.friendships.findMany({
              where: and(
                eq(schema.friendships.status, 'accepted'),
                or(
                  and(
                    eq(schema.friendships.userId, session.user.id),
                    eq(schema.friendships.friendId, suggestion.userId)
                  ),
                  and(
                    eq(schema.friendships.userId, suggestion.userId),
                    eq(schema.friendships.friendId, session.user.id)
                  )
                )
              ),
            });

            return {
              ...suggestion,
              mutualFriends: mutualFriendships.length,
            };
          })
        );

        app.logger.info(
          { userId: session.user.id, count: enrichedSuggestions.length },
          'Contact suggestions retrieved'
        );
        return enrichedSuggestions;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch contact suggestions'
        );
        throw error;
      }
    }
  );
}
