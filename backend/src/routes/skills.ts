/**
 * User Skills Routes
 * Manage user skills (up to 10 per user)
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerSkillRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/users/:id/skills
   * Get all skills for a user
   */
  app.fastify.get('/api/users/:id/skills', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    app.logger.info({ userId: id }, 'Fetching user skills');

    try {
      const skills = await app.db.query.userSkills.findMany({
        where: eq(schema.userSkills.userId, id),
      });

      app.logger.info({ userId: id, skillCount: skills.length }, 'User skills retrieved');
      return skills;
    } catch (error) {
      app.logger.error({ err: error, userId: id }, 'Failed to fetch user skills');
      throw error;
    }
  });

  /**
   * POST /api/users/me/skills
   * Add a skill (max 10 skills per user)
   */
  app.fastify.post('/api/users/me/skills', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { skillName, proficiencyLevel } = request.body as {
      skillName: string;
      proficiencyLevel: string;
    };

    app.logger.info(
      { userId: session.user.id, skillName, proficiencyLevel },
      'Adding skill'
    );

    try {
      // Check current skill count
      const existingSkills = await app.db.query.userSkills.findMany({
        where: eq(schema.userSkills.userId, session.user.id),
      });

      if (existingSkills.length >= 10) {
        app.logger.warn({ userId: session.user.id }, 'User has reached maximum skills limit');
        return reply.status(400).send({ error: 'Maximum 10 skills per user' });
      }

      // Validate skill level
      if (!['beginner', 'intermediate', 'expert'].includes(proficiencyLevel)) {
        app.logger.warn(
          { userId: session.user.id, proficiencyLevel },
          'Invalid skill level provided'
        );
        return reply.status(400).send({
          error: 'Skill level must be beginner, intermediate, or expert',
        });
      }

      const skill = await app.db
        .insert(schema.userSkills)
        .values({
          userId: session.user.id,
          skillName,
          proficiencyLevel,
        })
        .returning();

      app.logger.info(
        { userId: session.user.id, skillId: skill[0].id },
        'Skill added successfully'
      );
      return skill[0];
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, skillName, proficiencyLevel },
        'Failed to add skill'
      );
      throw error;
    }
  });

  /**
   * DELETE /api/users/me/skills/:id
   * Delete a skill
   */
  app.fastify.delete(
    '/api/users/me/skills/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, skillId: id }, 'Deleting skill');

      try {
        // Verify skill belongs to user
        const skill = await app.db.query.userSkills.findFirst({
          where: eq(schema.userSkills.id, id),
        });

        if (!skill || skill.userId !== session.user.id) {
          app.logger.warn(
            { userId: session.user.id, skillId: id },
            'Skill not found or unauthorized'
          );
          return reply.status(404).send({ error: 'Skill not found' });
        }

        await app.db.delete(schema.userSkills).where(eq(schema.userSkills.id, id));

        app.logger.info({ userId: session.user.id, skillId: id }, 'Skill deleted successfully');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, skillId: id },
          'Failed to delete skill'
        );
        throw error;
      }
    }
  );
}
