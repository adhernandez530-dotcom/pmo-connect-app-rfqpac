/**
 * OAuth Callback Routes
 * Handles OAuth authentication callbacks for both web and native platforms
 * Automatically creates user profiles with generated usernames on first-time OAuth login
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import { ensureUserProfile } from '../utils/username.js';

export function registerOAuthCallbackRoutes(app: App) {
  /**
   * GET /auth-callback
   * OAuth callback handler for web clients
   * Handles redirect from OAuth provider after user authorization
   * Supports both popup flow and redirect flow
   */
  app.fastify.get(
    '/auth-callback',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code, state, error, error_description } = request.query as {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
      };

      app.logger.info(
        {
          hasCode: !!code,
          hasError: !!error,
          errorType: error,
        },
        'OAuth callback received for web client'
      );

      try {
        if (error) {
          app.logger.warn(
            { error, errorDescription: error_description },
            'OAuth callback error'
          );

          // Return an HTML page that closes the popup or redirects
          return reply.type('text/html').send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Authentication</title>
                <script>
                  const error = ${JSON.stringify(error)};
                  const errorDescription = ${JSON.stringify(error_description || 'Authentication failed')};

                  // For popup flow
                  if (window.opener) {
                    window.opener.postMessage(
                      { type: 'oauth-error', error, errorDescription },
                      '*'
                    );
                    window.close();
                  } else {
                    // For redirect flow
                    window.location.href = '/auth?error=' + encodeURIComponent(error);
                  }
                </script>
              </head>
              <body>
                <p>Authentication failed: ${error}</p>
              </body>
            </html>
          `);
        }

        if (!code) {
          app.logger.warn('OAuth callback missing authorization code');
          return reply.status(400).send({
            error: 'Invalid OAuth callback: missing authorization code',
          });
        }

        app.logger.info({ codeLength: code.length }, 'OAuth authorization code received');

        // Return an HTML page that completes the OAuth flow
        // The Better Auth framework handles the token exchange
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Completing Authentication...</title>
              <script>
                const code = ${JSON.stringify(code)};
                const state = ${JSON.stringify(state)};

                // For popup flow - send message to parent window
                if (window.opener) {
                  window.opener.postMessage(
                    {
                      type: 'oauth-success',
                      code,
                      state
                    },
                    '*'
                  );
                  window.close();
                } else {
                  // For redirect flow - redirect to dashboard
                  window.location.href = '/dashboard';
                }
              </script>
            </head>
            <body>
              <p>Completing authentication...</p>
            </body>
          </html>
        `);
      } catch (error) {
        app.logger.error(
          { err: error, code: code?.substring(0, 10) },
          'Error handling OAuth callback'
        );

        return reply.status(500).type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Error</title>
              <script>
                if (window.opener) {
                  window.opener.postMessage(
                    { type: 'oauth-error', error: 'Internal server error' },
                    '*'
                  );
                  window.close();
                } else {
                  window.location.href = '/auth?error=server_error';
                }
              </script>
            </head>
            <body>
              <p>An error occurred during authentication</p>
            </body>
          </html>
        `);
      }
    }
  );

  /**
   * GET /auth-callback/expo
   * OAuth callback handler for native (Expo) clients
   * Handles deep linking for mobile app authentication
   * Redirects to putmeon://auth-callback with auth data
   */
  app.fastify.get(
    '/auth-callback/expo',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code, state, error, error_description } = request.query as {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
      };

      app.logger.info(
        {
          hasCode: !!code,
          hasError: !!error,
          source: 'expo',
        },
        'OAuth callback received for native (Expo) client'
      );

      try {
        if (error) {
          app.logger.warn(
            { error, errorDescription: error_description, source: 'expo' },
            'OAuth callback error from native'
          );

          // Deep link back to the app with error
          const errorUrl = `putmeon://auth-callback?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`;
          return reply.redirect(errorUrl);
        }

        if (!code) {
          app.logger.warn('OAuth callback missing authorization code (Expo)');
          return reply.redirect('putmeon://auth-callback?error=missing_code');
        }

        app.logger.info({ codeLength: code.length, source: 'expo' }, 'OAuth authorization code received for native');

        // Deep link back to the app with auth code
        // The Expo app will handle the token exchange using @better-auth/expo
        const successUrl = `putmeon://auth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`;
        return reply.redirect(successUrl);
      } catch (error) {
        app.logger.error(
          { err: error, source: 'expo' },
          'Error handling OAuth callback for native'
        );

        return reply.redirect('putmeon://auth-callback?error=server_error');
      }
    }
  );

  /**
   * GET /api/oauth/ensure-profile
   * Ensures user profile exists for OAuth-authenticated user
   * Called after OAuth sign-in to create profile with auto-generated username
   * Requires authentication via session
   */
  app.fastify.get(
    '/api/oauth/ensure-profile',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requireAuth = app.requireAuth();
      const session = await requireAuth(request, reply);

      if (!session) {
        app.logger.warn('Ensure profile: No session found');
        return;
      }

      app.logger.info(
        { userId: session.user.id, email: session.user.email },
        'Ensuring user profile exists for OAuth user'
      );

      try {
        const userId = session.user.id;
        const userName = session.user.name;
        const userEmail = session.user.email;
        const userImage = session.user.image;

        // Create profile if it doesn't exist
        await ensureUserProfile(userId, userName, userEmail, userImage, app);

        // Fetch and return the profile
        const profile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, userId),
        });

        if (!profile) {
          app.logger.error({ userId }, 'User profile not found after ensure attempt');
          return reply.status(500).send({ error: 'Failed to ensure user profile' });
        }

        app.logger.info(
          { userId, username: profile.username },
          'User profile ensured/created successfully'
        );

        return {
          success: true,
          profile: {
            id: profile.id,
            username: profile.username,
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          },
          message: 'User profile created/verified successfully',
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to ensure user profile'
        );
        return reply.status(500).send({
          error: 'Profile creation failed',
          message: 'OAuth authentication succeeded but profile creation encountered an error',
        });
      }
    }
  );

  /**
   * GET /oauth/info
   * Get OAuth configuration information for clients
   * Helps clients understand available OAuth flows
   */
  app.fastify.get(
    '/oauth/info',
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('OAuth info requested');

      return {
        callbackUrls: {
          web: {
            popup: '/auth-callback',
            redirect: '/auth-callback',
            note: 'Popup flow sends OAuth code to parent window via postMessage. Redirect flow redirects to dashboard.',
          },
          native: {
            deepLink: '/auth-callback/expo',
            scheme: 'putmeon://',
            callback: 'putmeon://auth-callback',
            note: 'Native app uses deep linking to receive OAuth code and state.',
          },
        },
        providers: ['google', 'apple', 'github'],
        endpoints: {
          signIn: 'POST /api/auth/sign-in/social',
          getSession: 'GET /api/auth/get-session',
          signOut: 'POST /api/auth/sign-out',
          ensureProfile: 'GET /api/oauth/ensure-profile (create/verify profile after OAuth)',
        },
      };
    }
  );
}
