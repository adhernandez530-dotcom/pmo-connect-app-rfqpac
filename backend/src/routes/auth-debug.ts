/**
 * Authentication Debug Routes
 * Health checks for authentication system and OAuth configuration
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
      service: 'PUT ME ON Backend',
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

  /**
   * GET /api/auth-health
   * Comprehensive authentication health check
   * Verifies auth system, OAuth config, and database connectivity
   * No authentication required - for debugging
   */
  app.fastify.get(
    '/api/auth-health',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Comprehensive auth health check');

      const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
      const appleConfigured = !!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET;
      const githubConfigured = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

      let dbHealthy = false;
      let dbError: string | null = null;

      try {
        // Quick database connectivity check
        const userCount = await app.db.query.user.findFirst();
        dbHealthy = true;
      } catch (error) {
        dbHealthy = false;
        dbError = String(error);
        app.logger.warn({ err: error }, 'Database health check failed');
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        auth: {
          enabled: true,
          message: 'Better Auth authentication system is enabled',
        },
        oauth: {
          proxyServiceAvailable: true,
          providers: {
            google: {
              configured: googleConfigured,
              method: googleConfigured ? 'custom' : 'proxy',
            },
            apple: {
              configured: appleConfigured,
              method: appleConfigured ? 'custom' : 'proxy',
            },
            github: {
              configured: githubConfigured,
              method: githubConfigured ? 'custom' : 'proxy',
            },
          },
        },
        database: {
          healthy: dbHealthy,
          message: dbHealthy ? 'Database connection successful' : `Database connection failed: ${dbError}`,
        },
        endpoints: {
          session: 'GET /api/auth/get-session (verify current session)',
          oauth: 'GET /api/oauth/config (check OAuth provider status)',
          flow: 'GET /api/oauth/flow (OAuth integration guide)',
          troubleshoot: 'GET /api/oauth/troubleshoot (OAuth troubleshooting guide)',
        },
        recommendations: [
          ...(googleConfigured ? [] : ['Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for custom Google OAuth']),
          ...(appleConfigured ? [] : ['Set APPLE_CLIENT_ID and APPLE_CLIENT_SECRET for custom Apple OAuth']),
          ...(dbHealthy ? [] : ['Check DATABASE_URL environment variable and ensure database is running']),
          'Verify TRUSTED_ORIGINS environment variable includes frontend URLs',
          'Ensure BASE_URL is set to the backend public URL for OAuth callbacks',
        ],
      };
    }
  );
}
