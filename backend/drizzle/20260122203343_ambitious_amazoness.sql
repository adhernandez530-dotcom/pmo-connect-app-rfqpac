ALTER TABLE "posts" DROP CONSTRAINT "posts_repost_of_id_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deactivated_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_repost_of_fk" FOREIGN KEY ("repost_of_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;