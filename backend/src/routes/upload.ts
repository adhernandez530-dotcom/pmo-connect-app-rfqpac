/**
 * File Upload Routes
 * General upload endpoint for images, videos, and audio files
 */

import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

// Supported MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4'];

export function registerUploadRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/upload/media
   * Upload media file (image, video, or audio)
   * Returns: { url: string, filename: string, mediaType: 'image' | 'video' | 'audio', key: string }
   */
  app.fastify.post(
    '/api/upload/media',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Uploading media file');

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
        let mediaType: 'image' | 'video' | 'audio';

        // Validate file type and determine media type
        if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
          mediaType = 'image';
        } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
          mediaType = 'video';
        } else if (ALLOWED_AUDIO_TYPES.includes(mimeType)) {
          mediaType = 'audio';
        } else {
          app.logger.warn(
            { userId: session.user.id, mimeType },
            'Unsupported file type'
          );
          return reply.status(400).send({
            error: `Unsupported file type. Supported types: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES].join(', ')}`,
          });
        }

        // Upload to storage
        const directory = mediaType === 'image' ? 'images' : mediaType === 'video' ? 'videos' : 'audio';
        const storageKey = `${directory}/${session.user.id}/${Date.now()}-${data.filename}`;
        const key = await app.storage.upload(storageKey, buffer);

        // Generate signed URL
        const { url } = await app.storage.getSignedUrl(key);

        app.logger.info(
          { userId: session.user.id, storageKey: key, mediaType, filename: data.filename },
          'Media file uploaded successfully'
        );

        return {
          url,
          key,
          filename: data.filename,
          mediaType,
        };
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to upload media file'
        );
        throw error;
      }
    }
  );
}
