/**
 * Account Management Routes
 * User logout and account deactivation
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { user } from '../db/auth-schema.js';

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
          where: eq(user.id, session.user.id),
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
          .update(user)
          .set({
            deactivatedAt: now,
            updatedAt: now,
          })
          .where(eq(user.id, session.user.id));

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
          where: eq(user.id, session.user.id),
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
}
