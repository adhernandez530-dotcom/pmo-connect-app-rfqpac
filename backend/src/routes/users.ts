/**
 * User Profile Routes
 * GET/PUT user profiles, avatar uploads
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerUserRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/users/me
   * Returns current user profile with onboarding status
   */
  app.fastify.get('/api/users/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching current user profile');

    try {
      const userProfile = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.id, session.user.id),
      });

      if (!userProfile) {
        app.logger.warn({ userId: session.user.id }, 'User profile not found');
        return reply.status(404).send({ error: 'Profile not found' });
      }

      app.logger.info({ userId: session.user.id }, 'User profile retrieved successfully');

      // Add onboardingComplete flag based on whether username is set
      const response = {
        ...userProfile,
        onboardingComplete: userProfile.username !== null,
      };

      return response;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch user profile');
      throw error;
    }
  });

  /**
   * PUT /api/users/me
   * Update current user profile
   */
  app.fastify.put('/api/users/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { fullName, bio, location, avatarUrl } = request.body as {
      fullName?: string;
      bio?: string;
      location?: string;
      avatarUrl?: string;
    };

    app.logger.info(
      { userId: session.user.id, body: request.body },
      'Updating user profile'
    );

    try {
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      updateData.updatedAt = new Date();

      const updated = await app.db
        .update(schema.userProfiles)
        .set(updateData)
        .where(eq(schema.userProfiles.id, session.user.id))
        .returning();

      app.logger.info({ userId: session.user.id }, 'User profile updated successfully');
      return updated[0];
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, body: request.body },
        'Failed to update user profile'
      );
      throw error;
    }
  });

  /**
   * GET /api/users/:id
   * Get user profile by ID with onboarding status
   */
  app.fastify.get('/api/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    app.logger.info({ userId: id }, 'Fetching user profile by ID');

    try {
      const userProfile = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.id, id),
      });

      if (!userProfile) {
        app.logger.warn({ userId: id }, 'User profile not found');
        return reply.status(404).send({ error: 'User not found' });
      }

      app.logger.info({ userId: id }, 'User profile retrieved successfully');

      // Add onboardingComplete flag based on whether username is set
      const response = {
        ...userProfile,
        onboardingComplete: userProfile.username !== null,
      };

      return response;
    } catch (error) {
      app.logger.error({ err: error, userId: id }, 'Failed to fetch user profile');
      throw error;
    }
  });

  /**
   * POST /api/users/avatar
   * Upload avatar image - multipart form data with 'avatar' field
   */
  app.fastify.post('/api/users/avatar', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Uploading avatar');

    try {
      const options = { limits: { fileSize: 10 * 1024 * 1024 } }; // 10MB limit
      const data = await request.file(options);
      if (!data) {
        app.logger.warn({ userId: session.user.id }, 'No file provided in avatar upload');
        return reply.status(400).send({ error: 'No file provided' });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        app.logger.warn({ userId: session.user.id }, 'Avatar file exceeds size limit');
        return reply.status(413).send({ error: 'File too large (max 10MB)' });
      }

      // Validate image type
      const mimeType = data.mimetype;
      if (!mimeType.startsWith('image/')) {
        app.logger.warn({ userId: session.user.id, mimeType }, 'Invalid file type for avatar');
        return reply.status(400).send({ error: 'File must be an image' });
      }

      // Upload to storage
      const storageKey = `avatars/${session.user.id}/${Date.now()}-${data.filename}`;
      const key = await app.storage.upload(storageKey, buffer);

      // Generate signed URL
      const { url } = await app.storage.getSignedUrl(key);

      app.logger.info({ userId: session.user.id, storageKey: key }, 'Avatar uploaded successfully');

      return { url, key };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to upload avatar');
      throw error;
    }
  });
}
