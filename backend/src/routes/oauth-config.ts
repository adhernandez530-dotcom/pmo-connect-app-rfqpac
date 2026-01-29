/**
 * OAuth Configuration Routes
 * Provides information about OAuth provider configuration and status
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export function registerOAuthConfigRoutes(app: App) {
  /**
   * GET /api/oauth/config
   * Get OAuth provider configuration status (without exposing secrets)
   * No authentication required - for frontend initialization
   */
  app.fastify.get(
    '/api/oauth/config',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('OAuth config status check');

      const googleEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
      const appleEnabled = !!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET;

      return {
        google: {
          enabled: googleEnabled,
          hasClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          method: googleEnabled ? 'custom' : 'proxy',
          endpoint: '/api/auth/sign-in/social',
        },
        apple: {
          enabled: appleEnabled,
          hasClientId: !!process.env.APPLE_CLIENT_ID,
          hasClientSecret: !!process.env.APPLE_CLIENT_SECRET,
          method: appleEnabled ? 'custom' : 'proxy',
          endpoint: '/api/auth/sign-in/social',
        },
        proxyAvailable: true,
        message: 'If credentials are not provided, OAuth uses the framework proxy service.',
      };
    }
  );

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
      const githubConfigured = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

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
          github: {
            configured: githubConfigured,
            method: githubConfigured ? 'custom' : 'proxy',
            endpoint: '/api/auth/sign-in/social',
            params: { provider: 'github' },
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
        available: ['google', 'apple', 'github'],
        endpoint: 'POST /api/auth/sign-in/social',
        usage: {
          google: { method: 'POST', body: { provider: 'google' } },
          apple: { method: 'POST', body: { provider: 'apple' } },
          github: { method: 'POST', body: { provider: 'github' } },
        },
        note: 'Social sign-in is available. Contact support if you experience issues.',
      };
    }
  );

  /**
   * GET /api/oauth/flow
   * OAuth flow documentation and integration guide
   * No authentication required
   */
  app.fastify.get(
    '/api/oauth/flow',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('OAuth flow documentation requested');

      return {
        title: 'OAuth Authentication Flow',
        description: 'Complete guide for implementing OAuth sign-in on the frontend',
        steps: [
          {
            step: 1,
            title: 'User initiates sign-in',
            description: 'User clicks "Continue with Google/Apple" button on frontend',
          },
          {
            step: 2,
            title: 'Frontend calls OAuth endpoint',
            description: 'POST /api/auth/sign-in/social with { provider: "google" | "apple" }',
            example: {
              method: 'POST',
              endpoint: '/api/auth/sign-in/social',
              body: { provider: 'google' },
            },
          },
          {
            step: 3,
            title: 'Backend handles OAuth',
            description: 'Backend redirects to OAuth provider (Google/Apple)',
            details: 'User authenticates with OAuth provider',
          },
          {
            step: 4,
            title: 'OAuth provider redirects back',
            description: 'OAuth provider calls backend callback endpoint',
            details: 'Backend validates authorization code and creates session',
          },
          {
            step: 5,
            title: 'Session established',
            description: 'Backend sets session cookie and redirects to frontend callback',
            response: {
              cookie: 'better-auth.session_token (HTTP-only)',
              statusCode: 302,
              location: '/auth/callback?session=established',
            },
          },
          {
            step: 6,
            title: 'Frontend detects session',
            description: 'Frontend detects session cookie and navigates to appropriate screen',
            actions: ['GET /api/auth/get-session to verify session', 'Redirect to onboarding or home'],
          },
        ],
        endpoints: {
          initiate: {
            method: 'POST',
            path: '/api/auth/sign-in/social',
            description: 'Initiate OAuth sign-in flow',
            body: { provider: 'string (google|apple|github)' },
            response: 'Redirect to OAuth provider',
          },
          getSession: {
            method: 'GET',
            path: '/api/auth/get-session',
            description: 'Verify current session and get user data',
            response: {
              user: { id: 'string', email: 'string', name: 'string' },
              session: { token: 'string', expiresAt: 'ISO timestamp' },
            },
          },
          signOut: {
            method: 'POST',
            path: '/api/auth/sign-out',
            description: 'Sign out and revoke session',
            response: { success: true },
          },
        },
        environment: {
          google: {
            required: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET',
            fallback: 'Framework proxy service (no credentials needed)',
          },
          apple: {
            required: 'APPLE_CLIENT_ID, APPLE_CLIENT_SECRET',
            fallback: 'Framework proxy service (no credentials needed)',
          },
          github: {
            required: 'GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET',
            fallback: 'Framework proxy service (no credentials needed)',
          },
        },
      };
    }
  );

  /**
   * GET /api/oauth/callback-urls
   * Get configured callback URLs for OAuth providers
   * No authentication required - useful for frontend configuration
   */
  app.fastify.get(
    '/api/oauth/callback-urls',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('OAuth callback URLs requested');

      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

      return {
        baseUrl,
        apiBaseUrl,
        callbackEndpoints: {
          google: {
            signInEndpoint: '/api/auth/sign-in/social',
            method: 'POST',
            redirectUri: `${apiBaseUrl}/api/auth/callback/google`,
            note: 'Configured in Google Cloud Console OAuth 2.0 credentials',
          },
          apple: {
            signInEndpoint: '/api/auth/sign-in/social',
            method: 'POST',
            redirectUri: `${apiBaseUrl}/api/auth/callback/apple`,
            note: 'Configured in Apple App ID Services',
          },
          github: {
            signInEndpoint: '/api/auth/sign-in/social',
            method: 'POST',
            redirectUri: `${apiBaseUrl}/api/auth/callback/github`,
            note: 'Configured in GitHub OAuth App settings',
          },
        },
        frontendCallbackUrl: {
          success: `${baseUrl}/auth/callback?session=established`,
          error: `${baseUrl}/auth/callback?error=authentication_failed`,
          note: 'Frontend should handle these callback URLs to complete the flow',
        },
      };
    }
  );

  /**
   * GET /api/oauth/troubleshoot
   * Troubleshooting guide for OAuth issues
   * No authentication required - for debugging
   */
  app.fastify.get(
    '/api/oauth/troubleshoot',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('OAuth troubleshooting guide requested');

      const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
      const appleConfigured = !!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET;

      return {
        title: 'OAuth Troubleshooting Guide',
        commonIssues: [
          {
            issue: 'OAuth sign-in redirects to OAuth provider but never returns',
            causes: [
              'Redirect URI mismatch - check OAuth provider console',
              'Callback URL not whitelisted in OAuth provider',
              'Backend callback endpoint not responding',
            ],
            solutions: [
              'Verify redirect URI matches OAuth provider configuration',
              'Check that callback endpoint is accessible',
              'Review OAuth provider error logs',
              'Ensure backend is running and responding to requests',
            ],
          },
          {
            issue: 'Session not created after OAuth sign-in',
            causes: [
              'Authorization code validation failed',
              'User data not found or invalid',
              'Session table not initialized',
            ],
            solutions: [
              'Check backend logs for authorization errors',
              'Verify user table has the authenticated user',
              'Ensure session table exists and is accessible',
              'Verify DATABASE_URL is set correctly',
            ],
          },
          {
            issue: 'Frontend receives error during OAuth callback',
            causes: [
              'CORS issues',
              'Missing or invalid session cookie',
              'Frontend callback handler not implemented',
            ],
            solutions: [
              'Verify CORS configuration includes frontend origin',
              'Check that session cookies are being set (HTTP-only)',
              'Implement frontend callback handler to detect session',
              'Use GET /api/auth/get-session to verify session exists',
            ],
          },
          {
            issue: 'Provider credentials not working (custom OAuth)',
            causes: [
              'CLIENT_ID or CLIENT_SECRET environment variables not set',
              'Credentials are incorrect or expired',
              'OAuth provider app deleted or disabled',
            ],
            solutions: [
              `Check that GOOGLE_CLIENT_ID=${googleConfigured ? '✓ set' : '✗ not set'}`,
              `Check that GOOGLE_CLIENT_SECRET=${googleConfigured ? '✓ set' : '✗ not set'}`,
              `Check that APPLE_CLIENT_ID=${appleConfigured ? '✓ set' : '✗ not set'}`,
              `Check that APPLE_CLIENT_SECRET=${appleConfigured ? '✓ set' : '✗ not set'}`,
              'If credentials are incorrect, the system will fall back to proxy service',
            ],
          },
        ],
        debugSteps: [
          '1. Check OAuth provider status: GET /api/oauth/config',
          '2. Review OAuth flow documentation: GET /api/oauth/flow',
          '3. Verify session after sign-in: GET /api/auth/get-session',
          '4. Check backend logs for authentication errors',
          '5. Verify callback URLs match OAuth provider configuration',
          '6. Test with proxy service if custom credentials are problematic',
        ],
      };
    }
  );
}
