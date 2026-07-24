ALTER TABLE "reading_progress" ADD COLUMN "reached_end_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "max_completed_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "max_read_percent" integer DEFAULT 0 NOT NULL;