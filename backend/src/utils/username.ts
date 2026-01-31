/**
 * Username Generation Utility
 * Generates unique usernames from names for OAuth users
 */

import type { App } from '../index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Generate a unique username from a name
 * @param name - Full name from OAuth provider (e.g., "John Doe")
 * @param app - Application instance for database access
 * @returns Promise<string> - Unique username
 *
 * Logic:
 * 1. Convert to lowercase, remove spaces and special characters
 * 2. Add random 4-digit suffix (1000-9999)
 * 3. Check uniqueness in user_profiles table
 * 4. If collision, retry with different random number (max 10 attempts)
 * 5. Fallback: use email-based username if all attempts fail
 */
export async function generateUsernameFromName(
  name: string,
  app: App,
  email?: string
): Promise<string> {
  if (!name || name.trim().length === 0) {
    throw new Error('Name is required for username generation');
  }

  // Sanitize name: lowercase, remove special chars, remove spaces
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/-+/g, ''); // Remove hyphens

  if (baseName.length === 0) {
    throw new Error('Name contains no valid characters for username generation');
  }

  // Try to find a unique username with random suffix
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const candidate = `${baseName}${randomSuffix}`;

    // Check if username already exists
    const existing = await app.db.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.username, candidate),
    });

    if (!existing) {
      return candidate;
    }
  }

  // Fallback: Use email prefix + 6-digit random number if name-based fails
  if (email) {
    const emailPrefix = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    if (emailPrefix.length > 0) {
      const randomSuffix = Math.floor(Math.random() * 900000) + 100000; // 100000-999999
      const fallbackUsername = `${emailPrefix}${randomSuffix}`;

      // Verify fallback username is also unique
      const existingFallback = await app.db.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.username, fallbackUsername),
      });

      if (!existingFallback) {
        return fallbackUsername;
      }
    }
  }

  // Last resort: timestamp-based username (should never reach here)
  const timestamp = Date.now().toString().slice(-8);
  return `user${timestamp}`;
}

/**
 * Create or update user profile during OAuth authentication
 * @param userId - User ID from authentication
 * @param name - Full name from OAuth provider
 * @param email - Email from OAuth provider
 * @param image - Profile image URL from OAuth provider
 * @param app - Application instance for database access
 * @returns Promise<void>
 */
export async function ensureUserProfile(
  userId: string,
  name: string | null | undefined,
  email: string,
  image: string | null | undefined,
  app: App
): Promise<void> {
  try {
    // Check if user profile already exists
    const existingProfile = await app.db.query.userProfiles.findFirst({
      where: eq(schema.userProfiles.id, userId),
    });

    if (existingProfile) {
      // User profile already exists, skip
      app.logger.info({ userId }, 'User profile already exists for OAuth user');
      return;
    }

    // Generate unique username
    const username = await generateUsernameFromName(name || email, app, email);

    // Create user profile
    await app.db.insert(schema.userProfiles).values({
      id: userId,
      username,
      fullName: name || null,
      avatarUrl: image || null,
    });

    app.logger.info(
      { userId, username, email },
      'User profile created for OAuth user'
    );
  } catch (error) {
    app.logger.error(
      { err: error, userId, email },
      'Failed to create user profile for OAuth user'
    );
    // Don't throw - authentication should still succeed even if profile creation fails
    // User can complete profile during onboarding
  }
}
