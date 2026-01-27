-- Create core authentication tables if they don't exist
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"deactivated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Drop conversation_messages if it exists (not used in current schema)
DROP TABLE IF EXISTS "conversation_messages" CASCADE;
--> statement-breakpoint
-- Clean up old constraints and indexes by attempting to drop only if tables exist
-- We use DO blocks to safely ignore errors
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocked_users') THEN
    ALTER TABLE "blocked_users" DROP CONSTRAINT IF EXISTS "blocked_users_user_id_user_profiles_id_fk";
    ALTER TABLE "blocked_users" DROP CONSTRAINT IF EXISTS "blocked_users_blocked_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_suggestions') THEN
    ALTER TABLE "contact_suggestions" DROP CONSTRAINT IF EXISTS "contact_suggestions_user_id_user_profiles_id_fk";
    ALTER TABLE "contact_suggestions" DROP CONSTRAINT IF EXISTS "contact_suggestions_suggested_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_participants') THEN
    ALTER TABLE "conversation_participants" DROP CONSTRAINT IF EXISTS "conversation_participants_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_creator_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friendships') THEN
    ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_user_id_user_profiles_id_fk";
    ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "friendships_friend_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_sender_id_user_profiles_id_fk";
    ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_recipient_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_user_profiles_id_fk";
    ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_actor_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_comments') THEN
    ALTER TABLE "post_comments" DROP CONSTRAINT IF EXISTS "post_comments_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_likes') THEN
    ALTER TABLE "post_likes" DROP CONSTRAINT IF EXISTS "post_likes_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_reports') THEN
    ALTER TABLE "post_reports" DROP CONSTRAINT IF EXISTS "post_reports_reporter_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_knowledge') THEN
    ALTER TABLE "user_knowledge" DROP CONSTRAINT IF EXISTS "user_knowledge_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_privacy_settings') THEN
    ALTER TABLE "user_privacy_settings" DROP CONSTRAINT IF EXISTS "user_privacy_settings_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_services') THEN
    ALTER TABLE "user_services" DROP CONSTRAINT IF EXISTS "user_services_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_skills') THEN
    ALTER TABLE "user_skills" DROP CONSTRAINT IF EXISTS "user_skills_user_id_user_profiles_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_codes') THEN
    ALTER TABLE "verification_codes" DROP CONSTRAINT IF EXISTS "verification_codes_user_id_user_profiles_id_fk";
  END IF;
END $$;
