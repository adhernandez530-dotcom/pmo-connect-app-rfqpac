/**
 * Account Management Routes
 * User logout and account deactivation with SMS verification
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerAccountRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/account/logout
   * Logout the current user
   * This endpoint delegates to Better Auth's built-in logout
   */
  app.fastify.post('/api/account/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'User logging out');

    try {
      // Better Auth handles logout automatically through the /api/auth/sign-out endpoint
      // This is a convenience endpoint that informs the client to use that endpoint
      app.logger.info({ userId: session.user.id }, 'Logout initiated successfully');
      return {
        success: true,
        message: 'Logout successful. Please use POST /api/auth/sign-out for actual session termination.',
        authEndpoint: '/api/auth/sign-out'
      };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to logout');
      throw error;
    }
  });

  /**
   * DELETE /api/account/deactivate
   * Deactivate the current user's account
   * Sets the deactivatedAt timestamp to mark the account as inactive
   */
  app.fastify.delete(
    '/api/account/deactivate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Deactivating account');

      try {
        // Check if account is already deactivated
        const currentUser = await app.db.query.user.findFirst({
          where: eq(schema.user.id, session.user.id),
        });

        if (!currentUser) {
          app.logger.warn({ userId: session.user.id }, 'User not found');
          return reply.status(404).send({ error: 'User not found' });
        }

        if (currentUser.deactivatedAt) {
          app.logger.warn({ userId: session.user.id }, 'Account already deactivated');
          return reply.status(400).send({ error: 'Account is already deactivated' });
        }

        // Mark account as deactivated
        const now = new Date();
        await app.db
          .update(schema.user)
          .set({
            deactivatedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.user.id, session.user.id));

        app.logger.info(
          { userId: session.user.id, deactivatedAt: now },
          'Account deactivated successfully'
        );

        return {
          success: true,
          message: 'Account deactivated successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to deactivate account'
        );
        throw error;
      }
    }
  );

  /**
   * GET /api/account/status
   * Check account status (active or deactivated)
   * Protected route
   */
  app.fastify.get(
    '/api/account/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Checking account status');

      try {
        const currentUser = await app.db.query.user.findFirst({
          where: eq(schema.user.id, session.user.id),
        });

        if (!currentUser) {
          app.logger.warn({ userId: session.user.id }, 'User not found');
          return reply.status(404).send({ error: 'User not found' });
        }

        app.logger.info(
          { userId: session.user.id, isDeactivated: !!currentUser.deactivatedAt },
          'Account status retrieved'
        );

        return {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          isDeactivated: !!currentUser.deactivatedAt,
          deactivatedAt: currentUser.deactivatedAt,
          createdAt: currentUser.createdAt,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to check account status'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/account/deactivate/request-code
   * Request a verification code for account deactivation via SMS
   */
  app.fastify.post(
    '/api/account/deactivate/request-code',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Requesting deactivation verification code');

      try {
        // Get user profile to check for phone number
        const userProfile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, session.user.id),
        });

        if (!userProfile || !userProfile.phoneNumber) {
          app.logger.warn(
            { userId: session.user.id },
            'User does not have a phone number on file'
          );
          return reply.status(400).send({
            error: 'Phone number not found. Please add a phone number to your profile first.',
          });
        }

        // Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        app.logger.info(
          { userId: session.user.id, phoneNumber: userProfile.phoneNumber },
          'Generated verification code'
        );

        // Store verification code in database
        await app.db.insert(schema.verificationCodes).values({
          userId: session.user.id,
          code,
          type: 'account_deactivation',
          expiresAt,
        });

        // TODO: Send SMS via Twilio or other SMS provider
        // For now, log the code (in production, remove logging of actual codes)
        app.logger.info(
          { userId: session.user.id, code },
          'Verification code ready to send'
        );

        // Mock SMS sending - in production, integrate with Twilio
        try {
          // const smsResponse = await sendSMS(userProfile.phoneNumber, `Your verification code is: ${code}`);
          app.logger.info(
            { userId: session.user.id, phoneNumber: userProfile.phoneNumber },
            'SMS sent successfully (mocked)'
          );
        } catch (smsError) {
          app.logger.error(
            { err: smsError, userId: session.user.id },
            'Failed to send SMS'
          );
          // Don't fail the request, just log it
        }

        return {
          success: true,
          message: 'Verification code sent to your phone',
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to request verification code'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/account/deactivate/verify
   * Verify the deactivation code and deactivate the account
   */
  app.fastify.post(
    '/api/account/deactivate/verify',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { code } = request.body as { code: string };

      app.logger.info({ userId: session.user.id }, 'Verifying deactivation code');

      try {
        if (!code || code.trim().length === 0) {
          app.logger.warn({ userId: session.user.id }, 'Empty verification code');
          return reply.status(400).send({ error: 'Verification code is required' });
        }

        // Find verification code
        const verificationCode = await app.db.query.verificationCodes.findFirst({
          where: eq(schema.verificationCodes.userId, session.user.id),
        });

        if (!verificationCode) {
          app.logger.warn(
            { userId: session.user.id },
            'No verification code found for user'
          );
          return reply.status(400).send({
            error: 'No verification code requested. Please request a code first.',
          });
        }

        // Check if code is expired
        if (new Date() > verificationCode.expiresAt) {
          app.logger.warn(
            { userId: session.user.id, codeId: verificationCode.id },
            'Verification code expired'
          );
          // Delete expired code
          await app.db
            .delete(schema.verificationCodes)
            .where(eq(schema.verificationCodes.id, verificationCode.id));

          return reply.status(400).send({
            error: 'Verification code has expired. Please request a new code.',
          });
        }

        // Verify code matches
        if (verificationCode.code !== code) {
          app.logger.warn(
            { userId: session.user.id, codeId: verificationCode.id },
            'Invalid verification code'
          );
          return reply.status(400).send({ error: 'Invalid verification code' });
        }

        // Check if account is already deactivated
        const currentUser = await app.db.query.user.findFirst({
          where: eq(schema.user.id, session.user.id),
        });

        if (!currentUser) {
          app.logger.warn({ userId: session.user.id }, 'User not found');
          return reply.status(404).send({ error: 'User not found' });
        }

        if (currentUser.deactivatedAt) {
          app.logger.warn({ userId: session.user.id }, 'Account already deactivated');
          return reply.status(400).send({ error: 'Account is already deactivated' });
        }

        // Mark account as deactivated
        const now = new Date();
        await app.db
          .update(schema.user)
          .set({
            deactivatedAt: now,
            updatedAt: now,
          })
          .where(eq(schema.user.id, session.user.id));

        // Delete the used verification code
        await app.db
          .delete(schema.verificationCodes)
          .where(eq(schema.verificationCodes.id, verificationCode.id));

        app.logger.info(
          { userId: session.user.id, deactivatedAt: now },
          'Account deactivated successfully via SMS verification'
        );

        return {
          success: true,
          message: 'Account deactivated successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to verify deactivation code'
        );
        throw error;
      }
    }
  );
}
