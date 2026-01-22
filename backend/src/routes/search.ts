/**
 * Search Routes
 * Search for users by name, username, or skills
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, ilike, or, inArray } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerSearchRoutes(app: App) {
  /**
   * GET /api/search/users?q=query
   * Search users by name, username, or skills (no auth required)
   */
  app.fastify.get('/api/search/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const { q } = request.query as { q: string };

    app.logger.info({ query: q }, 'Searching users');

    try {
      if (!q || q.trim().length === 0) {
        app.logger.warn({}, 'Empty search query');
        return reply.status(400).send({ error: 'Search query is required' });
      }

      // Search by username or fullName
      const users = await app.db.query.userProfiles.findMany({
        where: or(
          ilike(schema.userProfiles.username, `%${q}%`),
          ilike(schema.userProfiles.fullName, `%${q}%`)
        ),
      });

      // Get skills for each user
      const usersWithSkills = await Promise.all(
        users.map(async (user) => {
          const skills = await app.db.query.userSkills.findMany({
            where: eq(schema.userSkills.userId, user.id),
          });
          return {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            location: user.location,
            skills: skills.map((s) => s.skillName),
          };
        })
      );

      app.logger.info({ query: q, resultCount: usersWithSkills.length }, 'User search completed');
      return usersWithSkills;
    } catch (error) {
      app.logger.error({ err: error, query: q }, 'Failed to search users');
      throw error;
    }
  });

  /**
   * GET /api/search/skills?q=query
   * Search users by specific skill (no auth required)
   */
  app.fastify.get(
    '/api/search/skills',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { q } = request.query as { q: string };

      app.logger.info({ query: q }, 'Searching users by skill');

      try {
        if (!q || q.trim().length === 0) {
          app.logger.warn({}, 'Empty skill search query');
          return reply.status(400).send({ error: 'Search query is required' });
        }

        // Search skills by name
        const skills = await app.db.query.userSkills.findMany({
          where: ilike(schema.userSkills.skillName, `%${q}%`),
        });

        const userIds = [...new Set(skills.map((s) => s.userId))];

        if (userIds.length === 0) {
          app.logger.info({ query: q }, 'No users found with that skill');
          return [];
        }

        // Get user profiles
        const users = await app.db.query.userProfiles.findMany({
          where: inArray(schema.userProfiles.id, userIds),
        });

        // Enrich with skills
        const usersWithSkills = await Promise.all(
          users.map(async (user) => {
            const userSkills = await app.db.query.userSkills.findMany({
              where: eq(schema.userSkills.userId, user.id),
            });
            return {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              avatarUrl: user.avatarUrl,
              location: user.location,
              skills: userSkills.map((s) => s.skillName),
            };
          })
        );

        app.logger.info(
          { query: q, resultCount: usersWithSkills.length },
          'Skill search completed'
        );
        return usersWithSkills;
      } catch (error) {
        app.logger.error({ err: error, query: q }, 'Failed to search skills');
        throw error;
      }
    }
  );
}
