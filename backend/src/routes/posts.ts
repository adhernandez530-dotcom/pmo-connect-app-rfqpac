/**
 * Posts/Feed Routes
 * Manage posts with photos, videos, and audio
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, inArray, desc, and, or } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerPostRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/posts
   * Get all posts from friends (feed)
   */
  app.fastify.get('/api/posts', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching feed');

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
      friendIds.push(session.user.id); // Include own posts

      // Get posts from friends
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
          createdAt: schema.posts.createdAt,
        })
        .from(schema.posts)
        .leftJoin(schema.userProfiles, eq(schema.posts.userId, schema.userProfiles.id))
        .where(inArray(schema.posts.userId, friendIds))
        .orderBy(desc(schema.posts.createdAt));

      app.logger.info({ userId: session.user.id, postCount: posts.length }, 'Feed retrieved');
      return posts;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch feed');
      throw error;
    }
  });

  /**
   * GET /api/posts/user/:userId
   * Get posts by specific user
   */
  app.fastify.get('/api/posts/user/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };

    app.logger.info({ targetUserId: userId }, 'Fetching user posts');

    try {
      const userPosts = await app.db
        .select({
          id: schema.posts.id,
          userId: schema.posts.userId,
          username: schema.userProfiles.username,
          fullName: schema.userProfiles.fullName,
          avatarUrl: schema.userProfiles.avatarUrl,
          content: schema.posts.content,
          mediaUrl: schema.posts.mediaUrl,
          mediaType: schema.posts.mediaType,
          createdAt: schema.posts.createdAt,
        })
        .from(schema.posts)
        .leftJoin(schema.userProfiles, eq(schema.posts.userId, schema.userProfiles.id))
        .where(eq(schema.posts.userId, userId))
        .orderBy(desc(schema.posts.createdAt));

      app.logger.info({ targetUserId: userId, postCount: userPosts.length }, 'User posts retrieved');
      return userPosts;
    } catch (error) {
      app.logger.error({ err: error, targetUserId: userId }, 'Failed to fetch user posts');
      throw error;
    }
  });

  /**
   * POST /api/posts
   * Create a new post
   */
  app.fastify.post('/api/posts', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { content, mediaUrl, mediaType } = request.body as {
      content?: string;
      mediaUrl?: string;
      mediaType?: string;
    };

    app.logger.info({ userId: session.user.id, hasMedia: !!mediaUrl }, 'Creating post');

    try {
      if (!content && !mediaUrl) {
        app.logger.warn({ userId: session.user.id }, 'Post must have content or media');
        return reply.status(400).send({ error: 'Post must have content or media' });
      }

      const post = await app.db
        .insert(schema.posts)
        .values({
          userId: session.user.id,
          content: content || null,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
        })
        .returning();

      app.logger.info({ userId: session.user.id, postId: post[0].id }, 'Post created successfully');
      return post[0];
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, content, mediaUrl },
        'Failed to create post'
      );
      throw error;
    }
  });

  /**
   * DELETE /api/posts/:id
   * Delete a post
   */
  app.fastify.delete('/api/posts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params as { id: string };

    app.logger.info({ userId: session.user.id, postId: id }, 'Deleting post');

    try {
      // Verify post belongs to user
      const post = await app.db.query.posts.findFirst({
        where: eq(schema.posts.id, id),
      });

      if (!post || post.userId !== session.user.id) {
        app.logger.warn(
          { userId: session.user.id, postId: id },
          'Post not found or unauthorized'
        );
        return reply.status(404).send({ error: 'Post not found' });
      }

      await app.db.delete(schema.posts).where(eq(schema.posts.id, id));

      app.logger.info({ userId: session.user.id, postId: id }, 'Post deleted successfully');
      return { success: true };
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id, postId: id },
        'Failed to delete post'
      );
      throw error;
    }
  });

  /**
   * POST /api/posts/media
   * Upload post media - multipart form data with 'media' field
   */
  app.fastify.post('/api/posts/media', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Uploading post media');

    try {
      const data = await request.file();
      if (!data) {
        app.logger.warn({ userId: session.user.id }, 'No file provided in media upload');
        return reply.status(400).send({ error: 'No file provided' });
      }

      const buffer = await data.toBuffer();
      const mimeType = data.mimetype;
      const fileName = `media-${session.user.id}-${Date.now()}`;

      // Determine media type from mime type
      let mediaType = 'photo';
      if (mimeType.startsWith('video/')) mediaType = 'video';
      else if (mimeType.startsWith('audio/')) mediaType = 'audio';

      // Store in memory for now (in production would use S3)
      // Simulate URL generation
      const mediaUrl = `/uploads/media/${fileName}`;

      app.logger.info(
        { userId: session.user.id, fileName, mediaType },
        'Media file received'
      );

      return { mediaUrl, mediaType };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to upload media');
      throw error;
    }
  });
}
