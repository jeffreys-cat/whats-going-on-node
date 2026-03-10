CREATE TYPE "public"."batch_run_status" AS ENUM('succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "batch_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_type" text NOT NULL,
	"trigger_source" text NOT NULL,
	"status" "batch_run_status" NOT NULL,
	"queued_count" integer DEFAULT 0 NOT NULL,
	"started_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"message" text,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
