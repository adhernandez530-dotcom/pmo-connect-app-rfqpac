/**
 * Profile Management Routes
 * Update profile, manage services and knowledge
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerProfileRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * PUT /api/profile/update
   * Update user profile
   */
  app.fastify.put('/api/profile/update', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { username, fullName, location, bio, avatarUrl } = request.body as {
      username?: string;
      fullName?: string;
      location?: string;
      bio?: string;
      avatarUrl?: string;
    };

    app.logger.info({ userId: session.user.id }, 'Updating profile');

    try {
      const updateData: any = {};

      if (username !== undefined) {
        // Check if username is available
        const existing = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.username, username),
        });

        if (existing && existing.id !== session.user.id) {
          app.logger.warn({ username }, 'Username already taken');
          return reply.status(400).send({ error: 'Username already taken' });
        }

        updateData.username = username;
      }

      if (fullName !== undefined) updateData.fullName = fullName;
      if (location !== undefined) updateData.location = location;
      if (bio !== undefined) updateData.bio = bio;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      updateData.updatedAt = new Date();

      const updated = await app.db
        .update(schema.userProfiles)
        .set(updateData)
        .where(eq(schema.userProfiles.id, session.user.id))
        .returning();

      app.logger.info({ userId: session.user.id }, 'Profile updated successfully');
      return { success: true, profile: updated[0] };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to update profile');
      throw error;
    }
  });

  /**
   * POST /api/profile/upload-photo
   * Upload profile photo
   */
  app.fastify.post(
    '/api/profile/upload-photo',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Uploading profile photo');

      try {
        const data = await request.file();
        if (!data) {
          app.logger.warn({ userId: session.user.id }, 'No file provided');
          return reply.status(400).send({ error: 'No file provided' });
        }

        const fileName = `profile-${session.user.id}-${Date.now()}`;
        const url = `/uploads/profiles/${fileName}`;

        app.logger.info({ userId: session.user.id, fileName }, 'Profile photo uploaded');
        return { url };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to upload photo');
        throw error;
      }
    }
  );

  /**
   * GET /api/profile/services
   * Get current user's services
   */
  app.fastify.get('/api/profile/services', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching services');

    try {
      const services = await app.db.query.userServices.findMany({
        where: eq(schema.userServices.userId, session.user.id),
      });

      app.logger.info({ userId: session.user.id, count: services.length }, 'Services retrieved');
      return services;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch services');
      throw error;
    }
  });

  /**
   * GET /api/users/:id/services
   * Get another user's services (public endpoint)
   */
  app.fastify.get('/api/users/:id/services', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    app.logger.info({ userId: id }, 'Fetching user services');

    try {
      // Verify user exists
      const userProfile = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.id, id),
      });

      if (!userProfile) {
        app.logger.warn({ userId: id }, 'User not found');
        return reply.status(404).send({ error: 'User not found' });
      }

      const services = await app.db.query.userServices.findMany({
        where: eq(schema.userServices.userId, id),
      });

      app.logger.info({ userId: id, count: services.length }, 'User services retrieved');
      return services;
    } catch (error) {
      app.logger.error({ err: error, userId: id }, 'Failed to fetch user services');
      throw error;
    }
  });

  /**
   * POST /api/profile/services
   * Add a service
   */
  app.fastify.post('/api/profile/services', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { serviceName } = request.body as { serviceName: string };

    app.logger.info({ userId: session.user.id, serviceName }, 'Adding service');

    try {
      const service = await app.db
        .insert(schema.userServices)
        .values({
          userId: session.user.id,
          serviceName,
        })
        .returning();

      app.logger.info({ userId: session.user.id, serviceId: service[0].id }, 'Service added');
      return service[0];
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, serviceName }, 'Failed to add service');
      throw error;
    }
  });

  /**
   * DELETE /api/profile/services/:id
   * Delete a service
   */
  app.fastify.delete(
    '/api/profile/services/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, serviceId: id }, 'Deleting service');

      try {
        const service = await app.db.query.userServices.findFirst({
          where: eq(schema.userServices.id, id),
        });

        if (!service || service.userId !== session.user.id) {
          app.logger.warn({ userId: session.user.id, serviceId: id }, 'Service not found');
          return reply.status(404).send({ error: 'Service not found' });
        }

        await app.db.delete(schema.userServices).where(eq(schema.userServices.id, id));

        app.logger.info({ userId: session.user.id, serviceId: id }, 'Service deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, serviceId: id }, 'Failed to delete service');
        throw error;
      }
    }
  );

  /**
   * GET /api/profile/knowledge
   * Get current user's knowledge topics
   */
  app.fastify.get('/api/profile/knowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching knowledge topics');

    try {
      const knowledge = await app.db.query.userKnowledge.findMany({
        where: eq(schema.userKnowledge.userId, session.user.id),
      });

      app.logger.info({ userId: session.user.id, count: knowledge.length }, 'Knowledge retrieved');
      return knowledge;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch knowledge');
      throw error;
    }
  });

  /**
   * GET /api/users/:id/knowledge
   * Get another user's knowledge topics (public endpoint)
   */
  app.fastify.get('/api/users/:id/knowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    app.logger.info({ userId: id }, 'Fetching user knowledge topics');

    try {
      // Verify user exists
      const userProfile = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.id, id),
      });

      if (!userProfile) {
        app.logger.warn({ userId: id }, 'User not found');
        return reply.status(404).send({ error: 'User not found' });
      }

      const knowledge = await app.db.query.userKnowledge.findMany({
        where: eq(schema.userKnowledge.userId, id),
      });

      app.logger.info({ userId: id, count: knowledge.length }, 'User knowledge retrieved');
      return knowledge;
    } catch (error) {
      app.logger.error({ err: error, userId: id }, 'Failed to fetch user knowledge');
      throw error;
    }
  });

  /**
   * POST /api/profile/knowledge
   * Add a knowledge topic
   */
  app.fastify.post('/api/profile/knowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { topic } = request.body as { topic: string };

    app.logger.info({ userId: session.user.id, topic }, 'Adding knowledge topic');

    try {
      const knowledge = await app.db
        .insert(schema.userKnowledge)
        .values({
          userId: session.user.id,
          knowledgeArea: topic,
        })
        .returning();

      app.logger.info({ userId: session.user.id, knowledgeId: knowledge[0].id }, 'Knowledge added');
      return knowledge[0];
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, topic }, 'Failed to add knowledge');
      throw error;
    }
  });

  /**
   * DELETE /api/profile/knowledge/:id
   * Delete a knowledge topic
   */
  app.fastify.delete(
    '/api/profile/knowledge/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, knowledgeId: id }, 'Deleting knowledge topic');

      try {
        const knowledge = await app.db.query.userKnowledge.findFirst({
          where: eq(schema.userKnowledge.id, id),
        });

        if (!knowledge || knowledge.userId !== session.user.id) {
          app.logger.warn({ userId: session.user.id, knowledgeId: id }, 'Knowledge not found');
          return reply.status(404).send({ error: 'Knowledge not found' });
        }

        await app.db.delete(schema.userKnowledge).where(eq(schema.userKnowledge.id, id));

        app.logger.info({ userId: session.user.id, knowledgeId: id }, 'Knowledge deleted');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, knowledgeId: id },
          'Failed to delete knowledge'
        );
        throw error;
      }
    }
  );
}
