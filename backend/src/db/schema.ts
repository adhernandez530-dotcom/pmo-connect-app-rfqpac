/**
 * PUT ME ON App - Social Media Backend Schema
 * Database schema for user profiles, skills, posts, friendships, messages, and notifications
 */

import { pgTable, text, timestamp, boolean, uuid, foreignKey, unique, check, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth-schema.js';

/**
 * User Profiles
 * Extends Better Auth user table with additional profile information
 */
export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  bio: text('bio'),
  location: text('location'),
  avatarUrl: text('avatar_url'),
  phoneNumber: text('phone_number'),
  phoneVerified: boolean('phone_verified').default(false).notNull(),
  allowContacts: boolean('allow_contacts').default(false).notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * User Skills
 * Up to 10 skills per user with expertise levels
 */
export const userSkills = pgTable(
  'user_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    skillName: text('skill_name').notNull(),
    skillLevel: text('skill_level').notNull(), // 'beginner', 'intermediate', 'expert'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    skillLevelCheck: check('skill_level_check', sql`"skill_level" IN ('beginner', 'intermediate', 'expert')`),
  })
);

/**
 * Posts/Media Sharing
 * Photos, videos, and audio updates about projects
 */
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content'),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'), // 'photo', 'video', 'audio'
  repostOfId: uuid('repost_of_id'), // Self-reference for reposts (no FK constraint to avoid issues)
  likesCount: integer('likes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  repostsCount: integer('reposts_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Friendships
 * Connection requests and accepted friendships
 */
export const friendships = pgTable(
  'friendships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    friendId: text('friend_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull(), // 'pending', 'accepted', 'rejected'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    uniqueUserFriend: unique().on(table.userId, table.friendId),
    statusCheck: check('status_check', sql`"status" IN ('pending', 'accepted', 'rejected')`),
  })
);

/**
 * User Services
 * Services offered by users
 */
export const userServices = pgTable('user_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  serviceName: text('service_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * User Knowledge Topics
 * Topics/areas of expertise
 */
export const userKnowledge = pgTable('user_knowledge', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Post Likes
 * Tracks which users liked which posts
 */
export const postLikes = pgTable('post_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Post Comments
 * Comments on posts
 */
export const postComments = pgTable('post_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Contact Suggestions
 * Suggested contacts for users based on various sources
 */
export const contactSuggestions = pgTable('contact_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  suggestedUserId: text('suggested_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  source: text('source').notNull(), // 'mutual_friends', 'skill_match', 'service_needed', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Direct Messages
 * Private conversations between users
 */
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  read: boolean('read').default(false).notNull(),
  archived: boolean('archived').default(false).notNull(),
  muted: boolean('muted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Notifications
 * Friend requests, messages, post likes, and other events
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'friend_request', 'message', 'post_like', etc.
  content: text('content').notNull(),
  read: boolean('read').default(false).notNull(),
  relatedUserId: text('related_user_id').references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Verification Codes
 * Temporary codes for account actions (deactivation, phone verification, etc.)
 */
export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  type: text('type').notNull(), // 'account_deactivation', 'phone_verification', etc.
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Group Conversations
 * Stores group chat conversations
 */
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name'),
  description: text('description'),
  isGroup: boolean('is_group').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Conversation Participants
 * Tracks which users are members of which conversations
 */
export const conversationParticipants = pgTable('conversation_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

/**
 * Conversation Messages
 * Messages sent in group conversations
 */
export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
