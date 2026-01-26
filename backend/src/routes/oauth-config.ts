/**
 * OAuth Configuration Routes
 * Provides information about OAuth provider configuration
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export function registerOAuthConfigRoutes(app: App) {
  /**
   * GET /api/oauth/status
   * Get OAuth provider configuration status
   * No authentication required
   */
  app.fastify.get(
    '/api/oauth/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('OAuth status check');

      const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
      const appleConfigured = !!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET;

      return {
        status: 'ok',
        providers: {
          google: {
            configured: googleConfigured,
            method: googleConfigured ? 'custom' : 'proxy',
            endpoint: '/api/auth/sign-in/social',
            params: { provider: 'google' },
          },
          apple: {
            configured: appleConfigured,
            method: appleConfigured ? 'custom' : 'proxy',
            endpoint: '/api/auth/sign-in/social',
            params: { provider: 'apple' },
          },
        },
        note: 'If credentials are not configured, OAuth uses the framework proxy service for authentication.',
      };
    }
  );

  /**
   * GET /api/oauth/providers
   * Get list of available OAuth providers
   * No authentication required
   */
  app.fastify.get(
    '/api/oauth/providers',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('OAuth providers list requested');

      return {
        available: ['google', 'apple'],
        endpoint: 'POST /api/auth/sign-in/social',
        usage: {
          google: { method: 'POST', body: { provider: 'google' } },
          apple: { method: 'POST', body: { provider: 'apple' } },
        },
        note: 'Social sign-in is available. Contact support if you experience issues.',
      };
    }
  );
}
