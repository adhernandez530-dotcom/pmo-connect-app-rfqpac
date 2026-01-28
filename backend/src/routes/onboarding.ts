/**
 * Onboarding Routes
 * Complete user onboarding process
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerOnboardingRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/onboarding/complete
   * Complete user onboarding
   */
  app.fastify.post(
    '/api/onboarding/complete',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info(
        {
          method: request.method,
          path: request.url,
          bodyProvided: !!request.body,
        },
        'Onboarding request received'
      );

      const session = await requireAuth(request, reply);
      if (!session) {
        app.logger.warn(
          {
            path: request.url,
          },
          'Authentication failed - no session returned from requireAuth'
        );
        return;
      }

      const { username, fullName, location, bio, phoneNumber, allowContacts } = request.body as {
        username: string;
        fullName: string;
        location?: string;
        bio?: string;
        phoneNumber?: string;
        allowContacts?: boolean;
      };

      app.logger.info(
        { userId: session.user.id, username, bodyKeys: Object.keys(request.body as any || {}) },
        'Request body parsed'
      );

      app.logger.info({ userId: session.user.id, username }, 'Completing onboarding');

      try {
        // Check if profile already exists
        const existingProfile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, session.user.id),
        });

        if (existingProfile) {
          app.logger.warn({ userId: session.user.id }, 'Profile already exists');
          // Allow updates to existing profile
        }

        // Check if username is available (if different from existing)
        if (!existingProfile || existingProfile.username !== username) {
          const usernameExists = await app.db.query.userProfiles.findFirst({
            where: eq(schema.userProfiles.username, username),
          });

          if (usernameExists) {
            app.logger.warn({ username }, 'Username already taken');
            return reply.status(400).send({ error: 'Username already taken' });
          }
        }

        let profile;

        if (existingProfile) {
          // Update existing profile
          profile = await app.db
            .update(schema.userProfiles)
            .set({
              username,
              fullName,
              location: location || existingProfile.location,
              bio: bio || existingProfile.bio,
              phoneNumber: phoneNumber || existingProfile.phoneNumber,
              updatedAt: new Date(),
            })
            .where(eq(schema.userProfiles.id, session.user.id))
            .returning();
        } else {
          // Create new profile
          profile = await app.db
            .insert(schema.userProfiles)
            .values({
              id: session.user.id,
              username,
              fullName,
              location: location || null,
              bio: bio || null,
              phoneNumber: phoneNumber || null,
            })
            .returning();
        }

        app.logger.info(
          { userId: session.user.id, username, profileId: profile[0].id },
          'Onboarding completed successfully'
        );

        return { success: true, profile: profile[0] };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, username },
          'Failed to complete onboarding'
        );
        throw error;
      }
    }
  );

  /**
   * GET /api/onboarding/check-username/:username
   * Check if username is available
   */
  app.fastify.get(
    '/api/onboarding/check-username/:username',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { username } = request.params as { username: string };

      app.logger.info({ username }, 'Checking username availability');

      try {
        const existing = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.username, username),
        });

        const available = !existing;
        app.logger.info({ username, available }, 'Username availability checked');

        return { available };
      } catch (error) {
        app.logger.error({ err: error, username }, 'Failed to check username');
        throw error;
      }
    }
  );

  /**
   * GET /api/onboarding/debug
   * Debug endpoint to check authentication status and session info
   * Requires authentication to see which session is being used
   */
  app.fastify.get(
    '/api/onboarding/debug',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info(
        {
          method: request.method,
          path: request.url,
        },
        'Onboarding debug endpoint accessed'
      );

      try {
        const session = await requireAuth(request, reply);
        if (!session) {
          app.logger.warn('Debug: No session found');
          return { authenticated: false, message: 'No valid session' };
        }

        app.logger.info({ userId: session.user.id }, 'Debug: Session authenticated');

        return {
          authenticated: true,
          userId: session.user.id,
          userEmail: session.user.email,
          sessionId: session.session?.id,
          message: 'Session is valid and can be used for onboarding',
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Debug endpoint error');
        return { authenticated: false, error: String(error) };
      }
    }
  );
}
