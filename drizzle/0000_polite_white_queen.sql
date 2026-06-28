CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"avatar" text,
	"cover_image" text,
	"password" text NOT NULL,
	"refresh_token" text,
	"portfolio_slug" varchar(255),
	"portfolio_visibility" varchar(50) DEFAULT 'public',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_portfolio_slug_unique" UNIQUE("portfolio_slug")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"thumbnail" text,
	"raw_video_url" text NOT NULL,
	"hls_manifest_url" text,
	"is_transcoded" boolean DEFAULT false,
	"resolutions_available" jsonb DEFAULT '[]',
	"keyframes" jsonb DEFAULT '[]',
	"duration" integer DEFAULT 0,
	"share_password" text,
	"share_expiry_date" timestamp,
	"is_published" boolean DEFAULT true,
	"views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;