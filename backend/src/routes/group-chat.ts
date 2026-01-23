/**
 * Group Chat Routes
 * Manage group conversations and participants
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerGroupChatRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/messages/group/add-participant
   * Add a participant to a group conversation
   */
  app.fastify.post(
    '/api/messages/group/add-participant',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { conversationId, participantId } = request.body as {
        conversationId: string;
        participantId: string;
      };

      app.logger.info(
        { userId: session.user.id, conversationId, participantId },
        'Adding participant to group conversation'
      );

      try {
        // Validate input
        if (!conversationId || !participantId) {
          app.logger.warn(
            { userId: session.user.id },
            'Missing conversationId or participantId'
          );
          return reply.status(400).send({
            error: 'conversationId and participantId are required',
          });
        }

        // Check if conversation exists
        const conversation = await app.db.query.conversations.findFirst({
          where: eq(schema.conversations.id, conversationId),
        });

        if (!conversation) {
          app.logger.warn({ conversationId }, 'Conversation not found');
          return reply.status(404).send({ error: 'Conversation not found' });
        }

        // Check if user is a participant of the conversation
        const userIsParticipant = await app.db.query.conversationParticipants.findFirst({
          where: and(
            eq(schema.conversationParticipants.conversationId, conversationId),
            eq(schema.conversationParticipants.userId, session.user.id)
          ),
        });

        if (!userIsParticipant) {
          app.logger.warn(
            { userId: session.user.id, conversationId },
            'User is not a participant of this conversation'
          );
          return reply.status(403).send({
            error: 'You are not a member of this conversation',
          });
        }

        // Check if participant to be added exists
        const participantUser = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, participantId),
        });

        if (!participantUser) {
          app.logger.warn({ participantId }, 'Participant user not found');
          return reply.status(404).send({ error: 'User not found' });
        }

        // Prevent adding same user
        if (participantId === session.user.id) {
          app.logger.warn({ userId: session.user.id }, 'Cannot add self to conversation');
          return reply.status(400).send({
            error: 'Cannot add yourself to the conversation',
          });
        }

        // Check if participant is already in the conversation
        const alreadyParticipant = await app.db.query.conversationParticipants.findFirst({
          where: and(
            eq(schema.conversationParticipants.conversationId, conversationId),
            eq(schema.conversationParticipants.userId, participantId)
          ),
        });

        if (alreadyParticipant) {
          app.logger.warn(
            { conversationId, participantId },
            'User is already a participant'
          );
          return reply.status(400).send({
            error: 'User is already a member of this conversation',
          });
        }

        // Add participant to conversation
        await app.db.insert(schema.conversationParticipants).values({
          conversationId,
          userId: participantId,
        });

        app.logger.info(
          { conversationId, participantId, addedBy: session.user.id },
          'Participant added successfully'
        );

        return {
          success: true,
          message: 'Participant added to conversation successfully',
        };
      } catch (error) {
        app.logger.error(
          {
            err: error,
            userId: session.user.id,
            conversationId,
            participantId,
          },
          'Failed to add participant to conversation'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/messages/group/create
   * Create a new group conversation
   */
  app.fastify.post(
    '/api/messages/group/create',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { name, description, participantIds } = request.body as {
        name: string;
        description?: string;
        participantIds: string[];
      };

      app.logger.info(
        { userId: session.user.id, participantCount: participantIds?.length || 0 },
        'Creating group conversation'
      );

      try {
        if (!name || name.trim().length === 0) {
          app.logger.warn({ userId: session.user.id }, 'Conversation name is required');
          return reply.status(400).send({ error: 'Conversation name is required' });
        }

        if (!participantIds || participantIds.length === 0) {
          app.logger.warn({ userId: session.user.id }, 'At least one participant is required');
          return reply.status(400).send({
            error: 'At least one participant is required',
          });
        }

        // Verify all participants exist
        const participants = await app.db
          .select({ id: schema.userProfiles.id })
          .from(schema.userProfiles)
          .where(inArray(schema.userProfiles.id, participantIds));

        if (participants.length !== participantIds.length) {
          app.logger.warn(
            { userId: session.user.id, requestedCount: participantIds.length, foundCount: participants.length },
            'Some participants not found'
          );
          return reply.status(400).send({
            error: 'One or more participants not found',
          });
        }

        // Create conversation
        const conversation = await app.db
          .insert(schema.conversations)
          .values({
            createdBy: session.user.id,
            name,
            description,
            isGroup: true,
          })
          .returning();

        const conversationId = conversation[0].id;

        // Add creator as participant
        await app.db.insert(schema.conversationParticipants).values({
          conversationId,
          userId: session.user.id,
        });

        // Add other participants
        await app.db.insert(schema.conversationParticipants).values(
          participantIds.map((userId) => ({
            conversationId,
            userId,
          }))
        );

        app.logger.info(
          { conversationId, createdBy: session.user.id, participantCount: participantIds.length + 1 },
          'Group conversation created successfully'
        );

        return {
          success: true,
          message: 'Group conversation created successfully',
          conversationId,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, name },
          'Failed to create group conversation'
        );
        throw error;
      }
    }
  );

  /**
   * GET /api/messages/group/:conversationId/participants
   * Get all participants in a group conversation
   */
  app.fastify.get(
    '/api/messages/group/:conversationId/participants',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { conversationId } = request.params as { conversationId: string };

      app.logger.info(
        { userId: session.user.id, conversationId },
        'Fetching conversation participants'
      );

      try {
        // Check if user is a participant of the conversation
        const userIsParticipant = await app.db.query.conversationParticipants.findFirst({
          where: and(
            eq(schema.conversationParticipants.conversationId, conversationId),
            eq(schema.conversationParticipants.userId, session.user.id)
          ),
        });

        if (!userIsParticipant) {
          app.logger.warn(
            { userId: session.user.id, conversationId },
            'User is not a participant of this conversation'
          );
          return reply.status(403).send({
            error: 'You are not a member of this conversation',
          });
        }

        // Get all participants
        const participants = await app.db
          .select({
            id: schema.userProfiles.id,
            username: schema.userProfiles.username,
            fullName: schema.userProfiles.fullName,
            avatarUrl: schema.userProfiles.avatarUrl,
            joinedAt: schema.conversationParticipants.joinedAt,
          })
          .from(schema.conversationParticipants)
          .leftJoin(
            schema.userProfiles,
            eq(schema.conversationParticipants.userId, schema.userProfiles.id)
          )
          .where(
            eq(schema.conversationParticipants.conversationId, conversationId)
          );

        app.logger.info(
          { conversationId, participantCount: participants.length },
          'Conversation participants retrieved'
        );

        return participants;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, conversationId },
          'Failed to fetch conversation participants'
        );
        throw error;
      }
    }
  );

  /**
   * DELETE /api/messages/group/:conversationId/remove-participant/:participantId
   * Remove a participant from a group conversation
   */
  app.fastify.delete(
    '/api/messages/group/:conversationId/remove-participant/:participantId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { conversationId, participantId } = request.params as {
        conversationId: string;
        participantId: string;
      };

      app.logger.info(
        { userId: session.user.id, conversationId, participantId },
        'Removing participant from conversation'
      );

      try {
        // Check if conversation exists
        const conversation = await app.db.query.conversations.findFirst({
          where: eq(schema.conversations.id, conversationId),
        });

        if (!conversation) {
          app.logger.warn({ conversationId }, 'Conversation not found');
          return reply.status(404).send({ error: 'Conversation not found' });
        }

        // Check if user is the conversation creator or removing themselves
        if (
          conversation.createdBy !== session.user.id &&
          participantId !== session.user.id
        ) {
          app.logger.warn(
            { userId: session.user.id, conversationId },
            'Unauthorized to remove participant'
          );
          return reply.status(403).send({
            error: 'Only the conversation creator can remove other participants',
          });
        }

        // Check if participant exists in the conversation
        const participant = await app.db.query.conversationParticipants.findFirst({
          where: and(
            eq(schema.conversationParticipants.conversationId, conversationId),
            eq(schema.conversationParticipants.userId, participantId)
          ),
        });

        if (!participant) {
          app.logger.warn(
            { conversationId, participantId },
            'Participant not found in conversation'
          );
          return reply.status(404).send({
            error: 'Participant not found in this conversation',
          });
        }

        // Remove participant
        await app.db
          .delete(schema.conversationParticipants)
          .where(
            and(
              eq(schema.conversationParticipants.conversationId, conversationId),
              eq(schema.conversationParticipants.userId, participantId)
            )
          );

        app.logger.info(
          { conversationId, participantId, removedBy: session.user.id },
          'Participant removed successfully'
        );

        return {
          success: true,
          message: 'Participant removed from conversation successfully',
        };
      } catch (error) {
        app.logger.error(
          {
            err: error,
            userId: session.user.id,
            conversationId,
            participantId,
          },
          'Failed to remove participant from conversation'
        );
        throw error;
      }
    }
  );
}
