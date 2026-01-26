/**
 * Extended Posts Routes
 * Draft posts, post reports, and advanced features
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerPostsExtendedRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/posts/drafts
   * Save a draft post
   */
  app.fastify.post(
    '/api/posts/drafts',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { content, mediaUrl, mediaType, location, taggedUserIds } = request.body as {
        content?: string;
        mediaUrl?: string;
        mediaType?: string;
        location?: string;
        taggedUserIds?: string[];
      };

      app.logger.info({ userId: session.user.id }, 'Creating draft post');

      try {
        if (!content && !mediaUrl) {
          app.logger.warn({ userId: session.user.id }, 'Draft must have content or media');
          return reply.status(400).send({ error: 'Draft must have content or media' });
        }

        const draft = await app.db
          .insert(schema.posts)
          .values({
            userId: session.user.id,
            content: content || null,
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            location: location || null,
            taggedUserIds: taggedUserIds || null,
            isDraft: true,
          })
          .returning();

        app.logger.info({ userId: session.user.id, postId: draft[0].id }, 'Draft created');
        return draft[0];
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to create draft'
        );
        throw error;
      }
    }
  );

  /**
   * GET /api/posts/drafts
   * Get user's draft posts
   */
  app.fastify.get(
    '/api/posts/drafts',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching draft posts');

      try {
        const drafts = await app.db.query.posts.findMany({
          where: and(
            eq(schema.posts.userId, session.user.id),
            eq(schema.posts.isDraft, true)
          ),
        });

        app.logger.info(
          { userId: session.user.id, draftCount: drafts.length },
          'Drafts retrieved'
        );
        return drafts;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch drafts'
        );
        throw error;
      }
    }
  );

  /**
   * PUT /api/posts/drafts/:id
   * Update a draft post
   */
  app.fastify.put(
    '/api/posts/drafts/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const { content, mediaUrl, mediaType, location, taggedUserIds } = request.body as {
        content?: string;
        mediaUrl?: string;
        mediaType?: string;
        location?: string;
        taggedUserIds?: string[];
      };

      app.logger.info({ userId: session.user.id, draftId: id }, 'Updating draft');

      try {
        // Check if draft exists and belongs to user
        const draft = await app.db.query.posts.findFirst({
          where: eq(schema.posts.id, id),
        });

        if (!draft || draft.userId !== session.user.id || !draft.isDraft) {
          app.logger.warn({ userId: session.user.id, draftId: id }, 'Draft not found');
          return reply.status(404).send({ error: 'Draft not found' });
        }

        const updateData: any = {};
        if (content !== undefined) updateData.content = content;
        if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
        if (mediaType !== undefined) updateData.mediaType = mediaType;
        if (location !== undefined) updateData.location = location;
        if (taggedUserIds !== undefined) updateData.taggedUserIds = taggedUserIds;
        updateData.updatedAt = new Date();

        const updated = await app.db
          .update(schema.posts)
          .set(updateData)
          .where(eq(schema.posts.id, id))
          .returning();

        app.logger.info({ userId: session.user.id, draftId: id }, 'Draft updated');
        return updated[0];
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, draftId: id },
          'Failed to update draft'
        );
        throw error;
      }
    }
  );

  /**
   * DELETE /api/posts/drafts/:id
   * Delete a draft post
   */
  app.fastify.delete(
    '/api/posts/drafts/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, draftId: id }, 'Deleting draft');

      try {
        // Check if draft exists and belongs to user
        const draft = await app.db.query.posts.findFirst({
          where: eq(schema.posts.id, id),
        });

        if (!draft || draft.userId !== session.user.id || !draft.isDraft) {
          app.logger.warn({ userId: session.user.id, draftId: id }, 'Draft not found');
          return reply.status(404).send({ error: 'Draft not found' });
        }

        await app.db.delete(schema.posts).where(eq(schema.posts.id, id));

        app.logger.info({ userId: session.user.id, draftId: id }, 'Draft deleted');
        return { success: true };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, draftId: id },
          'Failed to delete draft'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/posts/drafts/:id/publish
   * Publish a draft post
   */
  app.fastify.post(
    '/api/posts/drafts/:id/publish',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      app.logger.info({ userId: session.user.id, draftId: id }, 'Publishing draft');

      try {
        // Check if draft exists and belongs to user
        const draft = await app.db.query.posts.findFirst({
          where: eq(schema.posts.id, id),
        });

        if (!draft || draft.userId !== session.user.id || !draft.isDraft) {
          app.logger.warn({ userId: session.user.id, draftId: id }, 'Draft not found');
          return reply.status(404).send({ error: 'Draft not found' });
        }

        const published = await app.db
          .update(schema.posts)
          .set({ isDraft: false, updatedAt: new Date() })
          .where(eq(schema.posts.id, id))
          .returning();

        app.logger.info({ userId: session.user.id, postId: id }, 'Draft published');
        return published[0];
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, draftId: id },
          'Failed to publish draft'
        );
        throw error;
      }
    }
  );

  /**
   * POST /api/posts/:id/report
   * Report a post
   */
  app.fastify.post(
    '/api/posts/:id/report',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason: string };

      app.logger.info(
        { userId: session.user.id, postId: id },
        'Reporting post'
      );

      try {
        if (!reason || reason.trim().length === 0) {
          app.logger.warn({ userId: session.user.id }, 'Report reason is required');
          return reply.status(400).send({ error: 'Reason is required' });
        }

        // Check if post exists
        const post = await app.db.query.posts.findFirst({
          where: eq(schema.posts.id, id),
        });

        if (!post) {
          app.logger.warn({ postId: id }, 'Post not found');
          return reply.status(404).send({ error: 'Post not found' });
        }

        // Check if user already reported this post
        const existingReport = await app.db.query.postReports.findFirst({
          where: and(
            eq(schema.postReports.postId, id),
            eq(schema.postReports.reporterId, session.user.id)
          ),
        });

        if (existingReport) {
          app.logger.warn(
            { userId: session.user.id, postId: id },
            'User already reported this post'
          );
          return reply.status(400).send({ error: 'You have already reported this post' });
        }

        const report = await app.db
          .insert(schema.postReports)
          .values({
            postId: id,
            reporterId: session.user.id,
            reason,
          })
          .returning();

        app.logger.info(
          { userId: session.user.id, postId: id, reportId: report[0].id },
          'Post reported'
        );
        return { success: true, reportId: report[0].id };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, postId: id },
          'Failed to report post'
        );
        throw error;
      }
    }
  );
}
