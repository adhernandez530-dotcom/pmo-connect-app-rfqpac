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
   * Create a new post with optional media upload and Instagram-like features
   * Accepts: multipart form data with 'content' (text) and 'media' (optional file)
   * Or: JSON body with content, mediaUrl, mediaType, location, taggedUserIds, isRepost, originalPostId
   */
  app.fastify.post('/api/posts', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Creating post');

    try {
      let content: string | null = null;
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      let location: string | null = null;
      let taggedUserIds: string[] | null = null;
      let isRepost = false;
      let originalPostId: string | null = null;

      // Check if this is multipart (file upload) or JSON
      const contentType = request.headers['content-type'];

      if (contentType?.includes('multipart/form-data')) {
        // Handle multipart form data
        const parts = request.parts();

        for await (const part of parts) {
          if (part.type === 'field') {
            if (part.fieldname === 'content') {
              content = part.value as string;
            } else if (part.fieldname === 'location') {
              location = part.value as string;
            } else if (part.fieldname === 'taggedUserIds') {
              try {
                taggedUserIds = JSON.parse(part.value as string);
              } catch (e) {
                // Continue if parsing fails
              }
            } else if (part.fieldname === 'isRepost') {
              isRepost = (part.value as string).toLowerCase() === 'true';
            } else if (part.fieldname === 'originalPostId') {
              originalPostId = part.value as string;
            }
          } else if (part.type === 'file' && part.fieldname === 'media') {
            const file = part;

            // Get file buffer
            let buffer: Buffer;
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of file.file) {
                chunks.push(chunk);
              }
              buffer = Buffer.concat(chunks);
            } catch (err) {
              app.logger.warn({ userId: session.user.id }, 'Media file exceeds size limit');
              return reply.status(413).send({ error: 'File too large' });
            }

            // Determine media type from MIME type
            const mimeType = file.mimetype;
            if (mimeType.startsWith('image/')) {
              mediaType = 'image';
            } else if (mimeType.startsWith('video/')) {
              mediaType = 'video';
            } else if (mimeType.startsWith('audio/')) {
              mediaType = 'audio';
            } else {
              app.logger.warn({ userId: session.user.id, mimeType }, 'Unsupported media type');
              return reply.status(400).send({ error: 'Unsupported media type' });
            }

            // Upload to storage
            const directory = mediaType === 'image' ? 'images' : mediaType === 'video' ? 'videos' : 'audio';
            const storageKey = `posts/${directory}/${session.user.id}/${Date.now()}-${file.filename}`;
            const key = await app.storage.upload(storageKey, buffer);

            // Generate signed URL
            const { url } = await app.storage.getSignedUrl(key);
            mediaUrl = url;

            app.logger.info(
              { userId: session.user.id, storageKey: key, mediaType },
              'Post media uploaded'
            );
          }
        }
      } else {
        // Handle JSON body
        const body = request.body as {
          content?: string;
          mediaUrl?: string;
          mediaType?: string;
          location?: string;
          taggedUserIds?: string[];
          isRepost?: boolean;
          originalPostId?: string;
        };

        content = body.content || null;
        mediaUrl = body.mediaUrl || null;
        mediaType = body.mediaType || null;
        location = body.location || null;
        taggedUserIds = body.taggedUserIds || null;
        isRepost = body.isRepost || false;
        originalPostId = body.originalPostId || null;
      }

      // Validate post has content or media
      if (!content && !mediaUrl) {
        app.logger.warn({ userId: session.user.id }, 'Post must have content or media');
        return reply.status(400).send({ error: 'Post must have content or media' });
      }

      // If isRepost, originalPostId is required
      if (isRepost && !originalPostId) {
        app.logger.warn({ userId: session.user.id }, 'Repost requires originalPostId');
        return reply.status(400).send({ error: 'Repost requires original post ID' });
      }

      // Create post in database
      const post = await app.db
        .insert(schema.posts)
        .values({
          userId: session.user.id,
          content: content,
          mediaUrl: mediaUrl,
          mediaType: mediaType,
          location: location,
          taggedUserIds: taggedUserIds,
          isRepost,
          originalPostId: originalPostId as any,
        })
        .returning();

      app.logger.info(
        { userId: session.user.id, postId: post[0].id, hasMedia: !!mediaUrl, isRepost },
        'Post created successfully'
      );
      return post[0];
    } catch (error) {
      app.logger.error(
        { err: error, userId: session.user.id },
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
   * Returns: { url: string, mediaType: 'image' | 'video' | 'audio', key: string }
   */
  app.fastify.post('/api/posts/media', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Uploading post media');

    try {
      const options = { limits: { fileSize: 100 * 1024 * 1024 } }; // 100MB limit
      const data = await request.file(options);
      if (!data) {
        app.logger.warn({ userId: session.user.id }, 'No file provided in media upload');
        return reply.status(400).send({ error: 'No file provided' });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        app.logger.warn({ userId: session.user.id }, 'Media file exceeds size limit');
        return reply.status(413).send({ error: 'File too large (max 100MB)' });
      }

      const mimeType = data.mimetype;

      // Determine media type from mime type
      let mediaType: 'image' | 'video' | 'audio' = 'image';
      if (mimeType.startsWith('video/')) mediaType = 'video';
      else if (mimeType.startsWith('audio/')) mediaType = 'audio';

      // Upload to storage
      const directory = mediaType === 'image' ? 'images' : mediaType === 'video' ? 'videos' : 'audio';
      const storageKey = `posts/${directory}/${session.user.id}/${Date.now()}-${data.filename}`;
      const key = await app.storage.upload(storageKey, buffer);

      // Generate signed URL
      const { url } = await app.storage.getSignedUrl(key);

      app.logger.info(
        { userId: session.user.id, storageKey: key, mediaType, filename: data.filename },
        'Post media uploaded successfully'
      );

      return { url, mediaType, key };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to upload media');
      throw error;
    }
  });
}
