-- Apply only after 0001_sender_profiles.sql, on a disposable Neon branch first.
-- OAuth state is short-lived. Access and refresh tokens are encrypted by the app.
CREATE TABLE "gmail_oauth_states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sender_profile_id" uuid NOT NULL REFERENCES "sender_profiles"("id") ON DELETE cascade,
  "state_hash" text NOT NULL UNIQUE,
  "code_verifier_ciphertext" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "gmail_credentials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sender_profile_id" uuid NOT NULL UNIQUE REFERENCES "sender_profiles"("id") ON DELETE cascade,
  "gmail_email" text NOT NULL,
  "encrypted_access_token" text NOT NULL,
  "encrypted_refresh_token" text NOT NULL,
  "token_expires_at" timestamp with time zone,
  "granted_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
