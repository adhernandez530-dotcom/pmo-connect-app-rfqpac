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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { username, fullName, location, bio, phoneNumber, allowContacts } = request.body as {
        username: string;
        fullName: string;
        location?: string;
        bio?: string;
        phoneNumber?: string;
        allowContacts?: boolean;
      };

      app.logger.info({ userId: session.user.id, username }, 'Completing onboarding');

      try {
        // Check if profile already exists
        const existingProfile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, session.user.id),
        });

        if (existingProfile && existingProfile.onboardingCompleted) {
          app.logger.warn({ userId: session.user.id }, 'Onboarding already completed');
          return reply.status(400).send({ error: 'Onboarding already completed' });
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
              allowContacts: allowContacts !== undefined ? allowContacts : existingProfile.allowContacts,
              onboardingCompleted: true,
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
              allowContacts: allowContacts || false,
              onboardingCompleted: true,
            })
            .returning();
        }

        app.logger.info(
          { userId: session.user.id, username },
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
}
