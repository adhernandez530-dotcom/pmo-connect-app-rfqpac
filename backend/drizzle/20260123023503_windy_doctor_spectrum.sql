CREATE TABLE "user_privacy_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_visibility" text DEFAULT 'public' NOT NULL,
	"message_permission" text DEFAULT 'anyone' NOT NULL,
	"services_visibility" text DEFAULT 'everyone' NOT NULL,
	"friends_list_visibility" text DEFAULT 'everyone' NOT NULL,
	"tag_permission" text DEFAULT 'anyone' NOT NULL,
	"comment_permission" text DEFAULT 'anyone' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_privacy_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_privacy_settings" ADD CONSTRAINT "user_privacy_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;