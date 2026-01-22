/**
 * Initialization Routes
 * Setup initial user profile after signup
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerInitRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/init/profile
   * Create initial user profile after signup
   */
  app.fastify.post('/api/init/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { username, fullName, bio, location } = request.body as {
      username: string;
      fullName: string;
      bio?: string;
      location?: string;
    };

    app.logger.info({ userId: session.user.id, username }, 'Initializing user profile');

    try {
      // Check if profile already exists
      const existingProfile = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.id, session.user.id),
      });

      if (existingProfile) {
        app.logger.warn({ userId: session.user.id }, 'Profile already exists');
        return reply.status(400).send({ error: 'Profile already initialized' });
      }

      // Check if username is available
      const usernameExists = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.username, username),
      });

      if (usernameExists) {
        app.logger.warn({ username }, 'Username already taken');
        return reply.status(400).send({ error: 'Username already taken' });
      }

      const profile = await app.db
        .insert(schema.userProfiles)
        .values({
          id: session.user.id,
          username,
          fullName,
          bio: bio || null,
          location: location || null,
        })
        .returning();

      app.logger.info(
        { userId: session.user.id, username },
        'User profile initialized successfully'
      );
      return profile[0];
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, username },
        'Failed to initialize user profile'
      );
      throw error;
    }
  });

  /**
   * GET /api/init/profile-exists
   * Check if user profile exists
   */
  app.fastify.get(
    '/api/init/profile-exists',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Checking if profile exists');

      try {
        const profile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, session.user.id),
        });

        app.logger.info(
          { userId: session.user.id, exists: !!profile },
          'Profile existence checked'
        );
        return { exists: !!profile };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to check profile');
        throw error;
      }
    }
  );
}
