-- Apply to a tested branch first. This project already has a production schema;
-- this migration is additive and must not be replaced by fresh create-table SQL.
CREATE TYPE "public"."sender_connection_status" AS ENUM ('not_connected', 'connected', 'needs_reconnect', 'disabled');

CREATE TABLE "sender_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sender_name" text NOT NULL,
  "sender_email" text NOT NULL,
  "company_name" text NOT NULL,
  "sender_title" text NOT NULL,
  "reply_to" text,
  "provider" text DEFAULT 'gmail' NOT NULL,
  "connection_status" "sender_connection_status" DEFAULT 'not_connected' NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sender_profiles_sender_email_unique" UNIQUE("sender_email")
);

ALTER TABLE "communications" ADD COLUMN "sender_profile_id" uuid;
ALTER TABLE "communications" ADD COLUMN "recipient_email" text;
ALTER TABLE "communications" ADD COLUMN "original_language" text;
ALTER TABLE "communications" ADD COLUMN "translated_body" text;
ALTER TABLE "communications" ADD COLUMN "external_thread_id" text;
ALTER TABLE "communications" ADD CONSTRAINT "communications_sender_profile_id_sender_profiles_id_fk" FOREIGN KEY ("sender_profile_id") REFERENCES "public"."sender_profiles"("id") ON DELETE set null;
