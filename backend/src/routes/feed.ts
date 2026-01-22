/**
 * Feed Routes
 * Extended feed with likes, comments, and reposts
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, inArray, desc, and, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerFeedRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/feed?sort=recent|popularity
   * Get feed with engagement metrics
   */
  app.fastify.get('/api/feed', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { sort } = request.query as { sort?: 'recent' | 'popularity' };

    app.logger.info({ userId: session.user.id, sort: sort || 'recent' }, 'Fetching feed');

    try {
      // Get accepted friends
      const friendships = await app.db.query.friendships.findMany({
        where: and(
          eq(schema.friendships.status, 'accepted'),
          or(
            eq(schema.friendships.userId, session.user.id),
            eq(schema.friendships.friendId, session.user.id)
          )
        ),
      });

      const friendIds = friendships.map((f) =>
        f.userId === session.user.id ? f.friendId : f.userId
      );
      friendIds.push(session.user.id);

      // Get posts
      const posts = await app.db
        .select({
          id: schema.posts.id,
          userId: schema.posts.userId,
          username: schema.userProfiles.username,
          fullName: schema.userProfiles.fullName,
          avatarUrl: schema.userProfiles.avatarUrl,
          content: schema.posts.content,
          mediaUrl: schema.posts.mediaUrl,
          mediaType: schema.posts.mediaType,
          likesCount: schema.posts.likesCount,
          commentsCount: schema.posts.commentsCount,
          repostsCount: schema.posts.repostsCount,
          repostOfId: schema.posts.repostOfId,
          createdAt: schema.posts.createdAt,
        })
        .from(schema.posts)
        .leftJoin(schema.userProfiles, eq(schema.posts.userId, schema.userProfiles.id))
        .where(inArray(schema.posts.userId, friendIds))
        .orderBy(sort === 'popularity' ? desc(schema.posts.likesCount) : desc(schema.posts.createdAt));

      // Enrich with user engagement
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          const isLiked = await app.db.query.postLikes.findFirst({
            where: and(
              eq(schema.postLikes.postId, post.id),
              eq(schema.postLikes.userId, session.user.id)
            ),
          });

          const repostOf = post.repostOfId
            ? await app.db.query.posts.findFirst({
                where: eq(schema.posts.id, post.repostOfId),
              })
            : null;

          return {
            ...post,
            isLiked: !!isLiked,
            isReposted: !!repostOf,
            repostOf,
          };
        })
      );

      app.logger.info({ userId: session.user.id, postCount: enrichedPosts.length }, 'Feed retrieved');
      return enrichedPosts;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch feed');
      throw error;
    }
  });

  /**
   * POST /api/posts/:id/like
   * Like a post
   */
  app.fastify.post('/api/posts/:id/like', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };

    app.logger.info({ userId: session.user.id, postId: id }, 'Liking post');

    try {
      const post = await app.db.query.posts.findFirst({
        where: eq(schema.posts.id, id),
      });

      if (!post) {
        app.logger.warn({ postId: id }, 'Post not found');
        return reply.status(404).send({ error: 'Post not found' });
      }

      // Check if already liked
      const existing = await app.db.query.postLikes.findFirst({
        where: and(
          eq(schema.postLikes.postId, id),
          eq(schema.postLikes.userId, session.user.id)
        ),
      });

      if (existing) {
        app.logger.warn({ userId: session.user.id, postId: id }, 'Already liked');
        return reply.status(400).send({ error: 'Already liked' });
      }

      // Add like
      await app.db.insert(schema.postLikes).values({
        postId: id,
        userId: session.user.id,
      });

      // Increment likes count
      const updated = await app.db
        .update(schema.posts)
        .set({ likesCount: post.likesCount + 1 })
        .where(eq(schema.posts.id, id))
        .returning();

      app.logger.info({ userId: session.user.id, postId: id }, 'Post liked');
      return { success: true, likesCount: updated[0].likesCount };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, postId: id }, 'Failed to like post');
      throw error;
    }
  });

  /**
   * DELETE /api/posts/:id/like
   * Unlike a post
   */
  app.fastify.delete('/api/posts/:id/like', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };

    app.logger.info({ userId: session.user.id, postId: id }, 'Unliking post');

    try {
      const post = await app.db.query.posts.findFirst({
        where: eq(schema.posts.id, id),
      });

      if (!post) {
        app.logger.warn({ postId: id }, 'Post not found');
        return reply.status(404).send({ error: 'Post not found' });
      }

      // Check if liked
      const like = await app.db.query.postLikes.findFirst({
        where: and(
          eq(schema.postLikes.postId, id),
          eq(schema.postLikes.userId, session.user.id)
        ),
      });

      if (!like) {
        app.logger.warn({ userId: session.user.id, postId: id }, 'Not liked');
        return reply.status(400).send({ error: 'Not liked' });
      }

      // Remove like
      await app.db.delete(schema.postLikes).where(eq(schema.postLikes.id, like.id));

      // Decrement likes count
      const updated = await app.db
        .update(schema.posts)
        .set({ likesCount: Math.max(0, post.likesCount - 1) })
        .where(eq(schema.posts.id, id))
        .returning();

      app.logger.info({ userId: session.user.id, postId: id }, 'Post unliked');
      return { success: true, likesCount: updated[0].likesCount };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, postId: id }, 'Failed to unlike post');
      throw error;
    }
  });

  /**
   * POST /api/posts/:id/repost
   * Repost a post
   */
  app.fastify.post('/api/posts/:id/repost', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };
    const { content } = request.body as { content?: string };

    app.logger.info({ userId: session.user.id, postId: id }, 'Creating repost');

    try {
      const post = await app.db.query.posts.findFirst({
        where: eq(schema.posts.id, id),
      });

      if (!post) {
        app.logger.warn({ postId: id }, 'Post not found');
        return reply.status(404).send({ error: 'Post not found' });
      }

      // Create repost
      const repost = await app.db
        .insert(schema.posts)
        .values({
          userId: session.user.id,
          content: content || null,
          repostOfId: id,
        })
        .returning();

      // Increment reposts count on original
      await app.db
        .update(schema.posts)
        .set({ repostsCount: post.repostsCount + 1 })
        .where(eq(schema.posts.id, id));

      app.logger.info({ userId: session.user.id, repostId: repost[0].id }, 'Repost created');
      return repost[0];
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, postId: id }, 'Failed to repost');
      throw error;
    }
  });

  /**
   * GET /api/posts/:id/comments
   * Get post comments
   */
  app.fastify.get(
    '/api/posts/:id/comments',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      app.logger.info({ postId: id }, 'Fetching comments');

      try {
        const comments = await app.db
          .select({
            id: schema.postComments.id,
            userId: schema.postComments.userId,
            username: schema.userProfiles.username,
            fullName: schema.userProfiles.fullName,
            avatarUrl: schema.userProfiles.avatarUrl,
            content: schema.postComments.content,
            createdAt: schema.postComments.createdAt,
          })
          .from(schema.postComments)
          .leftJoin(
            schema.userProfiles,
            eq(schema.postComments.userId, schema.userProfiles.id)
          )
          .where(eq(schema.postComments.postId, id))
          .orderBy(desc(schema.postComments.createdAt));

        app.logger.info({ postId: id, commentCount: comments.length }, 'Comments retrieved');
        return comments;
      } catch (error) {
        app.logger.error({ err: error, postId: id }, 'Failed to fetch comments');
        throw error;
      }
    }
  );

  /**
   * POST /api/posts/:id/comments
   * Add a comment to a post
   */
  app.fastify.post(
    '/api/posts/:id/comments',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const { content } = request.body as { content: string };

      app.logger.info({ userId: session.user.id, postId: id }, 'Adding comment');

      try {
        const post = await app.db.query.posts.findFirst({
          where: eq(schema.posts.id, id),
        });

        if (!post) {
          app.logger.warn({ postId: id }, 'Post not found');
          return reply.status(404).send({ error: 'Post not found' });
        }

        if (!content || content.trim().length === 0) {
          app.logger.warn({ userId: session.user.id }, 'Empty comment');
          return reply.status(400).send({ error: 'Comment content required' });
        }

        // Add comment
        const comment = await app.db
          .insert(schema.postComments)
          .values({
            postId: id,
            userId: session.user.id,
            content,
          })
          .returning();

        // Increment comments count
        await app.db
          .update(schema.posts)
          .set({ commentsCount: post.commentsCount + 1 })
          .where(eq(schema.posts.id, id));

        // Get user profile for response
        const profile = await app.db.query.userProfiles.findFirst({
          where: eq(schema.userProfiles.id, session.user.id),
        });

        app.logger.info({ userId: session.user.id, commentId: comment[0].id }, 'Comment added');
        return {
          id: comment[0].id,
          userId: comment[0].userId,
          username: profile?.username,
          fullName: profile?.fullName,
          avatarUrl: profile?.avatarUrl,
          content: comment[0].content,
          createdAt: comment[0].createdAt,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id, postId: id, content },
          'Failed to add comment'
        );
        throw error;
      }
    }
  );
}
