/**
 * PUT ME ON App - Social Media Backend Schema
 * Database schema for user profiles, skills, posts, friendships, messages, and notifications
 */

import { pgTable, text, timestamp, boolean, uuid, foreignKey, unique, check } from 'drizzle-orm/pg-core';
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
