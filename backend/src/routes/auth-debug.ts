/**
 * Authentication Debug Routes
 * Health checks for authentication system
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export function registerAuthDebugRoutes(app: App) {
  /**
   * GET /api/health
   * Health check for the application
   * No authentication required
   */
  app.fastify.get('/api/health', async (request: FastifyRequest, reply: FastifyReply) => {
    app.logger.info('Health check');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Application is operational',
    };
  });

  /**
   * GET /api/auth-status
   * Get authentication system status
   * No authentication required - for diagnostics only
   */
  app.fastify.get(
    '/api/auth-status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Auth status check');
      return {
        status: 'ok',
        authEnabled: true,
        message: 'Authentication system is configured and running',
        endpoints: {
          signup: 'POST /api/auth/sign-up/email',
          signin: 'POST /api/auth/sign-in/email',
          signout: 'POST /api/auth/sign-out',
          getSession: 'GET /api/auth/get-session',
          socialSignin: 'POST /api/auth/sign-in/social (provider: google|apple|github)',
          requestPasswordReset: 'POST /api/auth/request-password-reset',
          resetPassword: 'POST /api/auth/reset-password',
          sendVerificationEmail: 'POST /api/auth/send-verification-email',
          verifyEmail: 'GET /api/auth/verify-email/:token',
          emailStatus: 'GET /api/auth/email-status',
        },
      };
    }
  );
}
